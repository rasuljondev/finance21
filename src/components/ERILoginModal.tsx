"use client";

import { useState, useEffect } from "react";
import { getEIMZOClient, type EIMZOCertificate, parseCertificateData } from "@/lib/eimzo";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/Button";
import { X, AlertCircle, Search } from "lucide-react";

interface ERILoginModalProps {
  onSuccess: () => void;
  onCancel: () => void;
}

export default function ERILoginModal({ onSuccess, onCancel }: ERILoginModalProps) {
  const { loginWithERI } = useAuth();
  const [certificates, setCertificates] = useState<EIMZOCertificate[]>([]);
  const [selectedCert, setSelectedCert] = useState<EIMZOCertificate | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>("");
  const [step, setStep] = useState<"connecting" | "selecting" | "signing">("connecting");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    initializeEIMZO();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const initializeEIMZO = async () => {
    setLoading(true);
    setError("");
    try {
      const client = getEIMZOClient();
      const response = await client.getCertificates();
      if (response.success && response.certificates.length > 0) {
        setCertificates(response.certificates);
        setStep("selecting");
      } else {
        setError("No certificates found. Please ensure E-IMZO application is running and certificates are installed.");
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setError(`E-IMZO error: ${errorMsg}`);
      console.error("E-IMZO initialization error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    if (!selectedCert) {
      setError("Please select a certificate");
      return;
    }

    setLoading(true);
    setError("");
    setStep("signing");

    try {
      const client = getEIMZOClient();

      // Step 1: Load key
      const loadKeyResponse = await client.loadKey(selectedCert);
      if (!loadKeyResponse.success || !loadKeyResponse.keyId) {
        throw new Error(loadKeyResponse.error || "Error loading key");
      }
      const keyId = loadKeyResponse.keyId;

      // Step 2: Extract TIN from certificate
      const certData = parseCertificateData(selectedCert.alias);
      if (!certData.inn) {
        throw new Error("Tax ID not found in certificate. Please select another certificate.");
      }

      // Step 3: Create signature (sign TIN in base64)
      const dataToSign = btoa(certData.inn);
      const signatureResponse = await client.createSignature(dataToSign, keyId);
      if (!signatureResponse.success || !signatureResponse.pkcs7_64 || !signatureResponse.signature_hex) {
        throw new Error(signatureResponse.error || "Error creating signature");
      }

      // Step 4: Send signature to backend (backend will timestamp + exchange Didox token + create session)
      await loginWithERI({
        inn: certData.inn,
        pkcs7_64: signatureResponse.pkcs7_64,
        signature_hex: signatureResponse.signature_hex,
        companyName: certData.companyName || "Company",
        fullName: certData.fullName || "Director",
        pinfl: certData.pinfl || undefined,
      });
      onSuccess();
    } catch (err: unknown) {
      console.error("ERI login error:", err);
      let errorMsg = "Unknown error occurred";
      
      if (err instanceof Error) {
        errorMsg = err.message;
      } else if (typeof err === "string") {
        errorMsg = err;
      } else if (err && typeof err === "object" && "message" in err) {
        errorMsg = String(err.message);
      }
      
      setError(errorMsg);
      setStep("selecting");
    } finally {
      setLoading(false);
    }
  };

  const filteredCerts = certificates.filter(cert => {
    if (!searchQuery) return true;
    const data = parseCertificateData(cert.alias);
    const searchLower = searchQuery.toLowerCase();
    return (
      data.companyName.toLowerCase().includes(searchLower) ||
      data.inn.includes(searchQuery) ||
      data.fullName.toLowerCase().includes(searchLower) ||
      data.pinfl.includes(searchQuery)
    );
  });

  const handleCancel = () => {
    if (loading) return; // Prevent closing during login
    onCancel();
  };

  return (
    <div 
      className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300"
      onClick={handleCancel}
    >
      <div 
        className="bg-white dark:bg-[#1a1c2e] rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-hidden border border-white/10 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-100 dark:border-white/5 flex justify-between items-center bg-white dark:bg-[#111322]">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white tracking-normal">
            Login with ERI
          </h2>
          <button
            onClick={handleCancel}
            disabled={loading}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Search Bar - Only shown in selecting step */}
        {step === "selecting" && certificates.length > 0 && (
          <div className="px-6 py-3 border-b border-gray-100 dark:border-white/5 bg-slate-50/50 dark:bg-white/[0.02]">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
              <input
                type="text"
                placeholder="Search (Name, Tax ID, PINFL)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-normal"
              />
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 bg-white dark:bg-[#1a1c2e]">
          {error && (
            <div className="mb-4 p-4 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-lg text-red-800 dark:text-red-400 text-sm">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="font-semibold mb-1.5 text-xs">Error Occurred</div>
                  <p className="font-normal leading-relaxed text-sm">{error}</p>
                  
                  {error.includes("E-IMZO error") && (
                    <div className="mt-3 space-y-1.5 text-xs font-normal opacity-90 border-t border-red-200/50 dark:border-red-500/10 pt-3">
                      <div className="flex gap-2"><span>•</span> <span>Make sure E-IMZO application is running</span></div>
                      <div className="flex gap-2"><span>•</span> <span>Open the following page in your browser and confirm the certificate warning:</span></div>
                      <a
                        href="https://127.0.0.1:64443/apidoc.html"
                        target="_blank"
                        rel="noreferrer"
                        className="block mt-1.5 underline text-blue-700 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 transition-colors font-medium"
                      >
                        https://127.0.0.1:64443/apidoc.html
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {step === "connecting" && (
            <div className="text-center py-16">
              <div className="relative w-20 h-20 mx-auto mb-6">
                <div className="absolute inset-0 rounded-full border-4 border-blue-500/10" />
                <div className="absolute inset-0 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" />
              </div>
              <p className="text-slate-600 dark:text-slate-400 font-medium text-sm">
                Connecting to E-IMZO...
              </p>
            </div>
          )}

          {step === "selecting" && (
            <div className="space-y-3">
              {filteredCerts.length === 0 ? (
                <div className="text-center py-16">
                  <div className="w-16 h-16 bg-slate-50 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Search className="w-8 h-8 text-slate-300" />
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 font-normal text-sm">
                    {searchQuery ? "No certificates found matching your search" : "No certificates found"}
                  </p>
                  <button
                    onClick={initializeEIMZO}
                    className="mt-4 text-blue-600 dark:text-blue-400 font-medium text-sm hover:underline"
                  >
                    Retry
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredCerts.map((cert, index) => {
                    const isSelected = selectedCert === cert;
                    const data = parseCertificateData(cert.alias);
                    
                    // Format date
                    let formattedDate = data.validTo;
                    try {
                      const dateParts = data.validTo.split(' ')[0].split('.');
                      if (dateParts.length === 3) {
                        formattedDate = `${dateParts[0]}.${dateParts[1]}.${dateParts[2]}`;
                      }
                    } catch { /* ignore */ }

                    return (
                      <button
                        key={index}
                        onClick={() => setSelectedCert(cert)}
                        className={`w-full text-left p-4 rounded-xl border transition-all duration-200 group relative overflow-hidden bg-white dark:bg-white/[0.03] ${
                          isSelected
                            ? "border-blue-500 shadow-md shadow-blue-500/10 ring-2 ring-blue-500/10 dark:bg-blue-500/5"
                            : "border-slate-200 dark:border-white/10 hover:border-blue-300 dark:hover:border-white/20 hover:shadow-sm"
                        }`}
                      >
                        {/* Top row */}
                        <div className="flex justify-between items-start mb-3">
                          <span className={`text-[10px] font-semibold tracking-wide uppercase px-2.5 py-1 rounded-md ${
                            isSelected ? "bg-blue-600 text-white" : "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400"
                          }`}>
                            LEGAL ENTITY
                          </span>
                          <span className="text-xs font-medium text-slate-500 dark:text-slate-400">
                            Expires: <span className="text-slate-900 dark:text-slate-200 font-semibold">{formattedDate}</span>
                          </span>
                        </div>

                        {/* Middle section */}
                        <div className="mb-4">
                          <div className={`font-semibold text-base leading-snug mb-1.5 transition-colors ${
                            isSelected ? "text-blue-600 dark:text-blue-400" : "text-slate-900 dark:text-white"
                          }`}>
                            {(data.companyName || "COMPANY NAME").toUpperCase()}
                          </div>
                          <div className="text-xs font-normal text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                            DIRECTOR: <span className="text-slate-700 dark:text-slate-300 uppercase font-medium">{data.fullName}</span>
                          </div>
                        </div>

                        {/* Bottom row */}
                        <div className="flex justify-between items-center pt-3 border-t border-slate-100 dark:border-white/5">
                          <div className="text-xs font-normal text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                            PINFL: <span className="text-slate-900 dark:text-slate-200 font-semibold normal-case">{data.pinfl || "—"}</span>
                          </div>
                          <div className="text-xs font-normal text-slate-500 dark:text-slate-400 uppercase tracking-wide">
                            TAX ID: <span className="text-slate-900 dark:text-slate-200 font-semibold">{data.inn || "—"}</span>
                          </div>
                        </div>

                        {/* Selection checkmark */}
                        {isSelected && (
                          <div className="absolute top-0 right-0 w-7 h-7 bg-blue-500 text-white flex items-center justify-center rounded-bl-xl">
                            <div className="w-1.5 h-2.5 border-r-2 border-b-2 border-white rotate-45 mb-0.5" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {step === "signing" && (
            <div className="text-center py-16">
              <div className="relative w-20 h-20 mx-auto mb-6">
                <div className="absolute inset-0 rounded-full border-4 border-emerald-500/10" />
                <div className="absolute inset-0 rounded-full border-4 border-emerald-500 border-t-transparent animate-spin" />
              </div>
              <p className="text-slate-600 dark:text-slate-400 font-medium text-sm">
                Creating and verifying signature...
              </p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 dark:border-white/5 bg-white dark:bg-[#111322] flex gap-3">
          <button
            onClick={handleCancel}
            disabled={loading}
            className="flex-1 px-4 py-2.5 border border-slate-200 dark:border-white/10 rounded-lg text-slate-700 dark:text-slate-300 font-medium text-sm hover:bg-slate-50 dark:hover:bg-white/5 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleLogin}
            disabled={!selectedCert || loading || step !== "selecting"}
            className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 transition-all shadow-sm shadow-blue-500/20 disabled:opacity-50 disabled:grayscale disabled:shadow-none"
          >
            {loading ? "Please wait..." : "Login"}
          </button>
        </div>
      </div>
    </div>
  );
}
