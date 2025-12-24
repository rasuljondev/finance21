"use client";

import React, { useState, useEffect } from "react";
import {
  Settings,
  Building2,
  Calendar,
  Hash,
  MapPin,
  User,
  Key,
  Save,
  RefreshCw,
  Copy,
  CheckCircle2,
  MessageCircle,
  HelpCircle,
  DollarSign,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/contexts/AuthContext";
import { useAlert } from "@/components/ui/AlertProvider";
import apiClient from "@/lib/api-client";
import { cn } from "@/lib/utils";

interface CompanyData {
  id: string;
  tin: string;
  name: string;
  status: string;
  registrationDate: string | null;
  registrationNo: string | null;
  activityCode: string | null;
  companyType: string | null;
  dbibt: string | null;
  authorizedCapital: string | null;
  city: string | null;
  region: string | null;
  district: string | null;
  address: string | null;
  login: string | null;
  password: string | null;
  telegramId: string | null;
  director: {
    id: string;
    fullName: string;
    pinfl: string | null;
    jshshir: string | null;
  } | null;
  createdAt: string;
  updatedAt: string;
}

export default function SettingsPage() {
  const { company: authCompany } = useAuth();
  const { showSuccess, showError } = useAlert();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [company, setCompany] = useState<CompanyData | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    registrationDate: "",
    registrationNo: "",
    companyType: "",
    dbibt: "",
    authorizedCapital: "",
    address: "",
    telegramId: "",
  });

  useEffect(() => {
    fetchCompany();
  }, []);

  useEffect(() => {
    if (company) {
      setFormData({
        registrationDate: company.registrationDate
          ? new Date(company.registrationDate).toISOString().split("T")[0]
          : "",
        registrationNo: company.registrationNo || "",
        companyType: company.companyType || "",
        dbibt: company.dbibt || "",
        authorizedCapital: company.authorizedCapital || "",
        address: company.address || "",
        telegramId: company.telegramId || "",
      });
    }
  }, [company]);

  const fetchCompany = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get("/company");
      setCompany(response.data.company);
    } catch (err: any) {
      console.error("Error fetching company:", err);
      showError("Failed to load company information");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await apiClient.put("/company", formData);
      setCompany(response.data.company);
      showSuccess("Company information updated successfully");
    } catch (err: any) {
      console.error("Error updating company:", err);
      showError(err.response?.data?.message || "Failed to update company information");
    } finally {
      setSaving(false);
    }
  };

  const handleGenerateCredentials = async () => {
    if (!company?.registrationNo) {
      showError("Registration number is required. Please fill it in first.");
      return;
    }

    try {
      setGenerating(true);
      const response = await apiClient.post("/company/generate-credentials", {
        password: company.registrationNo,
      });
      setCompany((prev) =>
        prev
          ? {
              ...prev,
              login: response.data.credentials.login,
              password: response.data.credentials.password,
            }
          : null
      );
      showSuccess("Credentials generated successfully!");
    } catch (err: any) {
      console.error("Error generating credentials:", err);
      showError(err.response?.data?.message || "Failed to generate credentials");
    } finally {
      setGenerating(false);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
    showSuccess(`${label} copied to clipboard`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (!company) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="p-4 bg-red-500/10 rounded-full">
          <Settings className="w-12 h-12 text-red-500" />
        </div>
        <h1 className="text-2xl font-semibold text-white">Company Not Found</h1>
        <p className="text-slate-400">Unable to load company information.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <Settings className="w-8 h-8 text-blue-600" />
            Settings
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Manage your company information and credentials
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="primary" onClick={handleSave} isLoading={saving} leftIcon={<Save className="w-4 h-4" />}>
            Save Changes
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Company Information */}
        <div className="bg-white dark:bg-[#111322] rounded-3xl border border-slate-200 dark:border-white/5 p-6 shadow-sm space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-200 dark:border-white/5">
            <Building2 className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Company Information</h2>
          </div>

          <div className="space-y-4">
            <div>
              <Input
                label="Company STIR (TIN)"
                value={company.tin}
                disabled
                leftIcon={<Hash className="w-4 h-4" />}
              />
            </div>

            <div>
              <Input 
                label="Company Name" 
                value={company.name.toUpperCase()} 
                disabled 
                leftIcon={<Building2 className="w-4 h-4" />} 
              />
            </div>

            <div>
              <Input
                label="Registration Number"
                value={formData.registrationNo}
                onChange={(e) => setFormData({ ...formData, registrationNo: e.target.value })}
                leftIcon={<Hash className="w-4 h-4" />}
                placeholder="Enter registration number"
              />
            </div>

            <div>
              <Input
                label="Registration Date"
                type="date"
                value={formData.registrationDate}
                onChange={(e) => setFormData({ ...formData, registrationDate: e.target.value })}
                leftIcon={<Calendar className="w-4 h-4" />}
              />
            </div>

            <div>
              <Input
                label="Company Type"
                value={formData.companyType}
                onChange={(e) => setFormData({ ...formData, companyType: e.target.value })}
                placeholder="Enter company type"
              />
            </div>

            <div>
              <Input
                label="DBIBT (SOOGU)"
                value={formData.dbibt}
                onChange={(e) => setFormData({ ...formData, dbibt: e.target.value })}
                placeholder="Enter DBIBT code"
                helperText="Давлат бошқаруви идораларини белгилаш тизими"
              />
            </div>

            <div>
              <Input
                label="Authorized Capital (устав фонди суммаси)"
                value={formData.authorizedCapital}
                onChange={(e) => setFormData({ ...formData, authorizedCapital: e.target.value })}
                placeholder="Enter authorized capital amount"
                leftIcon={<DollarSign className="w-4 h-4" />}
              />
            </div>
          </div>
        </div>

        {/* Location & Contact */}
        <div className="bg-white dark:bg-[#111322] rounded-3xl border border-slate-200 dark:border-white/5 p-6 shadow-sm space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-200 dark:border-white/5">
            <MapPin className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Location & Contact</h2>
          </div>

          <div className="space-y-4">
            <div>
              <Input
                label="Address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                placeholder="Enter full address"
              />
            </div>

            <div className="relative">
              <Input
                label="Telegram ID"
                value={formData.telegramId}
                onChange={(e) => setFormData({ ...formData, telegramId: e.target.value })}
                placeholder="Enter Telegram User ID"
                leftIcon={<MessageCircle className="w-4 h-4" />}
                helperText="Get your ID from Finance21_bot on Telegram"
              />
              <div className="group relative">
                <HelpCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 cursor-help" />
                <div className="absolute right-0 top-full mt-2 w-64 p-3 bg-slate-900 dark:bg-slate-800 text-white text-xs rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                  <p className="font-bold mb-1">How to get your Telegram ID:</p>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Open Telegram</li>
                    <li>Search for <strong>Finance21_bot</strong></li>
                    <li>Start a conversation with the bot</li>
                    <li>Use <code>/start</code> command</li>
                    <li>Copy your User ID from the message</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Director Information */}
        {company.director && (
          <div className="bg-white dark:bg-[#111322] rounded-3xl border border-slate-200 dark:border-white/5 p-6 shadow-sm space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-200 dark:border-white/5">
              <User className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Director Information</h2>
            </div>

            <div className="space-y-4">
              <div>
                <Input 
                  label="Full Name" 
                  value={company.director.fullName.toUpperCase()} 
                  disabled 
                  leftIcon={<User className="w-4 h-4" />} 
                />
              </div>

              {company.director.pinfl && (
                <div>
                  <Input label="PINFL" value={company.director.pinfl} disabled leftIcon={<Hash className="w-4 h-4" />} />
                </div>
              )}

              {company.director.jshshir && (
                <div>
                  <Input label="JSHSHIR" value={company.director.jshshir} disabled leftIcon={<Hash className="w-4 h-4" />} />
                </div>
              )}
            </div>
          </div>
        )}

        {/* Credentials */}
        <div className="bg-white dark:bg-[#111322] rounded-3xl border border-slate-200 dark:border-white/5 p-6 shadow-sm space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-200 dark:border-white/5">
            <Key className="w-5 h-5 text-blue-600" />
            <h2 className="text-lg font-bold text-slate-900 dark:text-white">Login Credentials</h2>
          </div>

          <div className="space-y-4">
            <div>
              <Input
                label="Login (STIR)"
                value={company.login || company.tin}
                disabled
                leftIcon={<Hash className="w-4 h-4" />}
                rightIcon={
                  company.login ? (
                    <button
                      onClick={() => copyToClipboard(company.login!, "Login")}
                      className="p-1 hover:bg-slate-100 dark:hover:bg-white/10 rounded transition-colors"
                    >
                      {copied === "Login" ? (
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4 text-slate-400" />
                      )}
                    </button>
                  ) : null
                }
              />
            </div>

            <div>
              <Input
                label="Password (Registration Number)"
                type="password"
                value={company.password || ""}
                disabled
                leftIcon={<Key className="w-4 h-4" />}
                rightIcon={
                  company.password ? (
                    <button
                      onClick={() => copyToClipboard(company.password!, "Password")}
                      className="p-1 hover:bg-slate-100 dark:hover:bg-white/10 rounded transition-colors"
                    >
                      {copied === "Password" ? (
                        <CheckCircle2 className="w-4 h-4 text-green-600" />
                      ) : (
                        <Copy className="w-4 h-4 text-slate-400" />
                      )}
                    </button>
                  ) : null
                }
              />
            </div>

            <Button
              variant="primary"
              onClick={handleGenerateCredentials}
              isLoading={generating}
              leftIcon={<Key className="w-4 h-4" />}
              className="w-full"
            >
              {company.login ? "Regenerate Credentials" : "Generate Credentials"}
            </Button>

            {company.login && (
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Login is your STIR ({company.tin}). Password is your registration number.
              </p>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
