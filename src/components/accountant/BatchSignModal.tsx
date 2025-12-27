"use client";

import React, { useState, useEffect } from "react";
import { 
  X, 
  CheckCircle2, 
  RefreshCw, 
  FileText, 
  Key, 
  Play, 
  AlertCircle,
  Download,
  Building2
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { useAlert } from "@/components/ui/AlertProvider";
import apiClient from "@/lib/api-client";
import { getEIMZOClient, EIMZOCertificate, parseCertificateData } from "@/lib/eimzo";
import { cn } from "@/lib/utils";

interface DocInfo {
  id: string;
  number: string | null;
  date: string | null;
  amount: number | null;
  direction: "INCOMING" | "OUTGOING";
}

interface CompanySignGroup {
  companyId: string;
  companyName: string;
  tin: string;
  documents: DocInfo[];
  selectedCert?: EIMZOCertificate;
  companyToken?: string;
  status: "idle" | "logging_in" | "signing" | "completed" | "error";
  error?: string;
}

interface BatchSignModalProps {
  onClose: () => void;
  onComplete: () => void;
}

export default function BatchSignModal({ onClose, onComplete }: BatchSignModalProps) {
  const { showSuccess, showError } = useAlert();
  const [step, setStep] = useState<"preview" | "signing" | "done">("preview");
  const [groups, setGroups] = useState<CompanySignGroup[]>([]);
  const [allCerts, setAllCerts] = useState<EIMZOCertificate[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentProgress, setCurrentProgress] = useState({ total: 0, current: 0, success: 0, failed: 0 });

  const fetchSignable = async () => {
    setLoading(true);
    try {
      const [signRes, certRes] = await Promise.all([
        apiClient.get("/accountant/signable-docs"),
        getEIMZOClient().getCertificates()
      ]);

      if (signRes.data.ok) {
        const signableCompanies = signRes.data.companies.filter((c: any) => c.documents.length > 0);
        
        // Auto-match certificates by TIN
        const initialGroups = signableCompanies.map((c: any) => {
          const matchedCert = certRes.certificates.find(cert => {
            const data = parseCertificateData(cert.alias);
            return data.inn === c.tin;
          });
          return {
            ...c,
            selectedCert: matchedCert,
            status: "idle"
          };
        });

        setGroups(initialGroups);
        setAllCerts(certRes.certificates);
      }
    } catch (err) {
      console.error("Error fetching signable docs:", err);
      showError("Failed to load signing data. Make sure E-IMZO is running.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSignable();
  }, []);

  const totalDocs = groups.reduce((acc, g) => acc + g.documents.length, 0);

  const startSigning = async () => {
    // 1. Validate all companies have certificates
    const missing = groups.filter(g => !g.selectedCert);
    if (missing.length > 0) {
      showError(`Please select a certificate for ${missing[0].companyName}`);
      return;
    }

    setStep("signing");
    setCurrentProgress({ total: totalDocs, current: 0, success: 0, failed: 0 });

    const eimzo = getEIMZOClient();

    for (let i = 0; i < groups.length; i++) {
      const group = groups[i];
      updateGroupStatus(group.companyId, "logging_in");

      try {
        // Step A: Login to company via Didox
        const loginRes = await apiClient.post("/accountant/company-login", {
          companyTin: group.tin,
        });

        if (!loginRes.data.ok) throw new Error(loginRes.data.error || "Failed to login to company");
        const companyToken = loginRes.data.token;

        const cert = group.selectedCert!;
        const keyRes = await eimzo.loadKey(cert);
        if (!keyRes.success) throw new Error(keyRes.error || "Failed to load key");
        
        updateGroupStatus(group.companyId, "signing");

        for (const doc of group.documents) {
          try {
            // Step B: Get sign data (JSON or toSign)
            const dataRes = await apiClient.get(`/documents/${doc.id}/sign-data`);
            const { signData, type } = dataRes.data;

            // Step C: Sign via E-IMZO
            let docSig;
            if (type === "create_pkcs7") {
              docSig = await eimzo.createSignature(signData, keyRes.keyId!);
            } else {
              docSig = await eimzo.appendSignature(signData, keyRes.keyId!);
            }

            if (!docSig.success) throw new Error(docSig.error || "E-IMZO signing failed");

            // Submit RAW signatures to the queue and let the WORKER handle timestamping.
            // This is safer and faster for the UI.
            
            await apiClient.post("/batch-sign/submit", {
              documentId: doc.id,
              signature: docSig.pkcs7_64, // Worker will add timestamp
              companyId: group.companyId,
              companyToken: companyToken, 
            });

            setCurrentProgress(p => ({ ...p, current: p.current + 1, success: p.success + 1 }));
            
            // Throttle to prevent socket freeze
            await new Promise(r => setTimeout(r, 250));
          } catch (docErr: any) {
            console.error(`Failed to sign doc ${doc.id}:`, docErr);
            setCurrentProgress(p => ({ ...p, current: p.current + 1, failed: p.failed + 1 }));
          }
        }

        updateGroupStatus(group.companyId, "completed");
      } catch (err: any) {
        console.error(`Group ${group.companyName} failed:`, err);
        updateGroupStatus(group.companyId, "error", err.message);
      }
    }

    setStep("done");
    onComplete();
  };

  const updateGroupStatus = (companyId: string, status: CompanySignGroup["status"], error?: string) => {
    setGroups(current => current.map(g => g.companyId === companyId ? { ...g, status, error } : g));
  };

  if (!loading && groups.length === 0) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
        <div className="bg-white dark:bg-[#0f111a] w-full max-w-lg rounded-3xl p-8 text-center shadow-2xl">
          <CheckCircle2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">No Documents to Sign</h2>
          <p className="text-slate-500 mb-6">All your assigned companies are up to date.</p>
          <Button onClick={onClose} className="w-full">Close</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
      <div className="bg-white dark:bg-[#0f111a] w-full max-w-3xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-6 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-slate-50/50 dark:bg-white/[0.02]">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600 rounded-xl text-white">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight">Batch Signing Session</h2>
              <p className="text-xs text-slate-500 font-medium uppercase tracking-wider">
                {groups.length} companies • {totalDocs} documents
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-full transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {step === "preview" && (
            <>
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-2xl border border-blue-100 dark:border-blue-800/30 flex gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                <p className="text-sm text-blue-800 dark:text-blue-300 leading-relaxed">
                  Verify the keys for each company. You will only need to enter your E-IMZO password <strong>once</strong> for each key used.
                </p>
              </div>

              <div className="space-y-3">
                {groups.map((group) => (
                  <div key={group.companyId} className="p-4 rounded-2xl border border-slate-200 dark:border-white/5 bg-white dark:bg-white/[0.01] hover:border-blue-200 dark:hover:border-blue-900/50 transition-colors">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Building2 className="w-4 h-4 text-slate-400" />
                        <span className="font-bold text-sm uppercase">{group.companyName}</span>
                        <span className="text-[10px] bg-slate-100 dark:bg-white/5 px-1.5 py-0.5 rounded font-mono text-slate-500">{group.tin}</span>
                      </div>
                      <span className="text-xs font-black text-blue-600 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded-lg">
                        {group.documents.length} Docs
                      </span>
                    </div>
                    
                    <select 
                      className="w-full bg-slate-50 dark:bg-[#111322] border border-slate-200 dark:border-white/5 rounded-xl px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                      value={group.selectedCert?.alias || ""}
                      onChange={(e) => {
                        const cert = allCerts.find(c => c.alias === e.target.value);
                        setGroups(prev => prev.map(g => g.companyId === group.companyId ? { ...g, selectedCert: cert } : g));
                      }}
                    >
                      <option value="">Select E-IMZO Key...</option>
                      {allCerts.map(cert => (
                        <option key={cert.alias} value={cert.alias}>
                          {parseCertificateData(cert.alias).fullName} ({parseCertificateData(cert.alias).inn})
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </>
          )}

          {step === "signing" && (
            <div className="space-y-8 py-8">
              <div className="text-center space-y-4">
                <div className="relative w-32 h-32 mx-auto">
                  <svg className="w-full h-full transform -rotate-90">
                    <circle cx="64" cy="64" r="60" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-slate-100 dark:text-white/5" />
                    <circle cx="64" cy="64" r="60" stroke="currentColor" strokeWidth="8" fill="transparent" 
                      strokeDasharray={377}
                      strokeDashoffset={377 - (377 * currentProgress.current) / currentProgress.total}
                      className="text-blue-600 transition-all duration-500 ease-out" 
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-2xl font-black">{Math.round((currentProgress.current / currentProgress.total) * 100)}%</span>
                    <span className="text-[10px] uppercase font-bold text-slate-500">Progress</span>
                  </div>
                </div>
                <div>
                  <h3 className="text-xl font-bold">Processing Batch</h3>
                  <p className="text-sm text-slate-500 font-medium">Signing {currentProgress.current} of {currentProgress.total} documents</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-2xl border border-emerald-100 dark:border-emerald-800/30 text-center">
                  <div className="text-2xl font-black text-emerald-600">{currentProgress.success}</div>
                  <div className="text-xs uppercase font-bold text-emerald-700/70">Successful</div>
                </div>
                <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-100 dark:border-red-800/30 text-center">
                  <div className="text-2xl font-black text-red-600">{currentProgress.failed}</div>
                  <div className="text-xs uppercase font-bold text-red-700/70">Failed</div>
                </div>
              </div>

              <div className="space-y-2 max-h-48 overflow-y-auto pr-2">
                {groups.map(g => (
                  <div key={g.companyId} className="flex items-center justify-between text-xs p-2 rounded-lg bg-slate-50 dark:bg-white/5">
                    <span className="font-bold truncate max-w-[200px] uppercase">{g.companyName}</span>
                    <div className="flex items-center gap-2">
                      {g.status === "logging_in" && <><RefreshCw className="w-3 h-3 animate-spin text-blue-500" /> <span className="text-blue-500 font-bold uppercase">Logging in...</span></>}
                      {g.status === "signing" && <><RefreshCw className="w-3 h-3 animate-spin text-amber-500" /> <span className="text-amber-500 font-bold uppercase">Signing...</span></>}
                      {g.status === "completed" && <><CheckCircle2 className="w-3 h-3 text-emerald-500" /> <span className="text-emerald-500 font-bold uppercase">Done</span></>}
                      {g.status === "error" && <><AlertCircle className="w-3 h-3 text-red-500" /> <span className="text-red-500 font-bold uppercase">Failed</span></>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {step === "done" && (
            <div className="py-12 text-center space-y-6">
              <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-full flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black">Signing Complete!</h3>
                <p className="text-slate-500 font-medium">
                  Processed {currentProgress.total} documents across {groups.length} companies.<br/>
                  The signatures are being synchronized with Didox in the background.
                </p>
              </div>
              <div className="flex flex-col gap-3 max-w-sm mx-auto">
                <Button onClick={onClose} className="w-full py-6 text-lg">Back to Dashboard</Button>
                <Button variant="secondary" className="w-full gap-2">
                  <Download className="w-4 h-4" />
                  Download Session Log
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {step === "preview" && (
          <div className="p-6 border-t border-slate-100 dark:border-white/5 flex gap-3">
            <Button variant="secondary" onClick={onClose} className="flex-1">Cancel</Button>
            <Button onClick={startSigning} disabled={loading || groups.length === 0} className="flex-1 gap-2 py-6">
              <Play className="w-4 h-4" />
              Start Batch Signing
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

