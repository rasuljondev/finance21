"use client";

import React, { useState, useEffect } from "react";
import { useAlert } from "@/components/ui/AlertProvider";
import apiClient from "@/lib/api-client";
import { Building2, User, Calendar, FileText, RefreshCw, Search } from "lucide-react";

interface Company {
  id: string;
  tin: string;
  name: string;
  status: string;
  address: string | null;
  login: string | null;
  telegramId: string | null;
  registrationDate: string | null;
  activityCode: string | null;
  director: {
    id: string;
    fullName: string;
    pinfl: string | null;
    jshshir: string | null;
  } | null;
  documentCount: number;
  createdAt: string;
  updatedAt: string;
}

export default function SuperadminDashboardPage() {
  const { showSuccess, showError } = useAlert();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/superadmin/companies");
      if (res.data.ok) {
        setCompanies(res.data.companies);
      }
    } catch (error) {
      showError("Failed to fetch companies");
      console.error("Error fetching companies:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const filteredCompanies = companies.filter((company) => {
    const search = searchTerm.toLowerCase();
    return (
      company.name.toLowerCase().includes(search) ||
      company.tin.toLowerCase().includes(search) ||
      company.director?.fullName.toLowerCase().includes(search) ||
      company.address?.toLowerCase().includes(search)
    );
  });

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
            Registered Companies
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Manage all registered companies in the system
          </p>
        </div>
        <button
          onClick={fetchCompanies}
          disabled={loading}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white dark:bg-[#111322] border border-slate-200 dark:border-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/10 transition-all ${
            loading ? "animate-spin" : ""
          }`}
        >
          <RefreshCw className="w-5 h-5" />
          <span className="font-bold text-sm">Refresh</span>
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
        <input
          type="text"
          placeholder="Search by company name, TIN, director, or address..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-xl bg-white dark:bg-[#111322] border border-slate-200 dark:border-white/5 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-[#111322] rounded-xl p-4 border border-slate-200 dark:border-white/5">
          <div className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase">Total Companies</div>
          <div className="text-2xl font-black text-slate-900 dark:text-white mt-2">{companies.length}</div>
        </div>
        <div className="bg-white dark:bg-[#111322] rounded-xl p-4 border border-slate-200 dark:border-white/5">
          <div className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase">Active</div>
          <div className="text-2xl font-black text-green-600 dark:text-green-400 mt-2">
            {companies.filter((c) => c.status === "ACTIVE").length}
          </div>
        </div>
        <div className="bg-white dark:bg-[#111322] rounded-xl p-4 border border-slate-200 dark:border-white/5">
          <div className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase">Blocked</div>
          <div className="text-2xl font-black text-red-600 dark:text-red-400 mt-2">
            {companies.filter((c) => c.status === "BLOCKED").length}
          </div>
        </div>
        <div className="bg-white dark:bg-[#111322] rounded-xl p-4 border border-slate-200 dark:border-white/5">
          <div className="text-sm font-bold text-slate-400 dark:text-slate-500 uppercase">Total Documents</div>
          <div className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-2">
            {companies.reduce((sum, c) => sum + c.documentCount, 0)}
          </div>
        </div>
      </div>

      {/* Companies List */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-8 h-8 text-slate-400 animate-spin" />
        </div>
      ) : filteredCompanies.length === 0 ? (
        <div className="bg-white dark:bg-[#111322] rounded-xl p-12 border border-slate-200 dark:border-white/5 text-center">
          <Building2 className="w-12 h-12 text-slate-400 mx-auto mb-4" />
          <p className="text-slate-600 dark:text-slate-400 font-medium">
            {searchTerm ? "No companies found matching your search" : "No companies registered yet"}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredCompanies.map((company) => (
            <div
              key={company.id}
              className="bg-white dark:bg-[#111322] rounded-xl p-6 border border-slate-200 dark:border-white/5 hover:shadow-lg transition-all"
            >
              <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black text-lg">
                      {company.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-black text-slate-900 dark:text-white uppercase">
                          {company.name}
                        </h3>
                        <span
                          className={`px-2 py-1 rounded text-xs font-bold ${
                            company.status === "ACTIVE"
                              ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                              : "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                          }`}
                        >
                          {company.status}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                          <span className="font-bold">STIR:</span>
                          <span className="font-mono">{company.tin}</span>
                        </div>
                        {company.login && (
                          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                            <span className="font-bold">Login:</span>
                            <span>{company.login}</span>
                          </div>
                        )}
                        {company.director && (
                          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                            <User className="w-4 h-4" />
                            <span className="font-bold">Director:</span>
                            <span className="uppercase">{company.director.fullName}</span>
                          </div>
                        )}
                        {company.address && (
                          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                            <Building2 className="w-4 h-4" />
                            <span className="uppercase">{company.address}</span>
                          </div>
                        )}
                        {company.registrationDate && (
                          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                            <Calendar className="w-4 h-4" />
                            <span className="font-bold">Registered:</span>
                            <span>{formatDate(company.registrationDate)}</span>
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                          <FileText className="w-4 h-4" />
                          <span className="font-bold">Documents:</span>
                          <span>{company.documentCount}</span>
                        </div>
                        {company.telegramId && (
                          <div className="flex items-center gap-2 text-slate-600 dark:text-slate-400">
                            <span className="font-bold">Telegram ID:</span>
                            <span>{company.telegramId}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

