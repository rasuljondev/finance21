"use client";

import React, { useState, useEffect } from "react";
import { LayoutDashboard, Building2, Hash, RefreshCw, Search } from "lucide-react";
import { useAccountantLayout } from "@/components/layout/AccountantLayoutProvider";
import apiClient from "@/lib/api-client";
import { useAlert } from "@/components/ui/AlertProvider";
import { cn } from "@/lib/utils";

interface DocStats {
  total: number;
  signed: number;
  pending: number;
  cancelled: number;
  rejected: number;
}

interface Company {
  id: string;
  tin: string;
  name: string;
  stats: {
    invoices: DocStats;
    poa: DocStats;
    contracts: DocStats;
  };
}

export default function AccountantDashboardPage() {
  const { selectedCompanyId } = useAccountantLayout();
  const { showError } = useAlert();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get("/accountant/companies");
      if (res.data.ok) {
        setCompanies(res.data.companies);
      }
    } catch (err) {
      console.error("Error fetching companies:", err);
      showError("Failed to load companies data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const filteredCompanies = companies.filter((c) => {
    const matchesSearch = 
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.tin.includes(searchTerm);
    const matchesSelect = selectedCompanyId === "all" || c.id === selectedCompanyId;
    return matchesSearch && matchesSelect;
  });

  const totals = filteredCompanies.reduce((acc, c) => {
    const categories: ("invoices" | "poa" | "contracts")[] = ["invoices", "poa", "contracts"];
    categories.forEach(cat => {
      acc[cat].total += c.stats[cat].total;
      acc[cat].signed += c.stats[cat].signed;
      acc[cat].pending += c.stats[cat].pending;
      acc[cat].cancelled += c.stats[cat].cancelled;
      acc[cat].rejected += c.stats[cat].rejected;
    });
    return acc;
  }, {
    invoices: { total: 0, signed: 0, pending: 0, cancelled: 0, rejected: 0 },
    poa: { total: 0, signed: 0, pending: 0, cancelled: 0, rejected: 0 },
    contracts: { total: 0, signed: 0, pending: 0, cancelled: 0, rejected: 0 },
  });

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <LayoutDashboard className="w-8 h-8 text-blue-600" />
            Accountant Dashboard
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Overview of all assigned companies and document statuses
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search companies..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 bg-white dark:bg-[#111322] border border-slate-200 dark:border-white/5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
            />
          </div>
          <button
            onClick={fetchCompanies}
            disabled={loading}
            className="p-2.5 rounded-xl bg-white dark:bg-[#111322] border border-slate-200 dark:border-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/10 transition-all"
          >
            <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin" : ""}`} />
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-[#111322] rounded-3xl border border-slate-200 dark:border-white/5 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1200px]">
            <thead>
              <tr className="bg-slate-50 dark:bg-white/[0.02] border-b border-slate-200 dark:border-white/5 text-[11px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                <th className="px-4 py-4 w-12 text-center" rowSpan={2}>№</th>
                <th className="px-4 py-4 min-w-[200px]" rowSpan={2}>Company Name</th>
                <th className="px-4 py-4 w-32" rowSpan={2}>STIR (TIN)</th>
                <th className="px-4 py-2 text-center border-l border-slate-200 dark:border-white/5" colSpan={5}>Invoices (Factura)</th>
                <th className="px-4 py-2 text-center border-l border-slate-200 dark:border-white/5" colSpan={5}>Power of Attorney</th>
                <th className="px-4 py-2 text-center border-l border-slate-200 dark:border-white/5" colSpan={5}>Contracts</th>
              </tr>
              <tr className="bg-slate-50 dark:bg-white/[0.02] border-b border-slate-200 dark:border-white/5 text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-tight">
                {/* Invoices sub-headers */}
                <th className="px-2 py-2 text-center border-l border-slate-200 dark:border-white/5">Total</th>
                <th className="px-2 py-2 text-center">Signed</th>
                <th className="px-2 py-2 text-center">Pending</th>
                <th className="px-2 py-2 text-center">Cancelled</th>
                <th className="px-2 py-2 text-center">Rejected</th>
                {/* POA sub-headers */}
                <th className="px-2 py-2 text-center border-l border-slate-200 dark:border-white/5">Total</th>
                <th className="px-2 py-2 text-center">Signed</th>
                <th className="px-2 py-2 text-center">Pending</th>
                <th className="px-2 py-2 text-center">Cancelled</th>
                <th className="px-2 py-2 text-center">Rejected</th>
                {/* Contracts sub-headers */}
                <th className="px-2 py-2 text-center border-l border-slate-200 dark:border-white/5">Total</th>
                <th className="px-2 py-2 text-center">Signed</th>
                <th className="px-2 py-2 text-center">Pending</th>
                <th className="px-2 py-2 text-center">Cancelled</th>
                <th className="px-2 py-2 text-center">Rejected</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={18} className="px-4 py-12 text-center">
                    <RefreshCw className="w-8 h-8 animate-spin text-blue-600 mx-auto" />
                  </td>
                </tr>
              ) : filteredCompanies.length === 0 ? (
                <tr>
                  <td colSpan={18} className="px-4 py-12 text-center text-slate-500 dark:text-slate-400 font-medium">
                    No companies found matching your selection
                  </td>
                </tr>
              ) : (
                filteredCompanies.map((company, index) => (
                  <tr key={company.id} className="hover:bg-slate-50 dark:hover:bg-white/[0.01] transition-colors text-sm">
                    <td className="px-4 py-4 text-center text-slate-400 font-mono">{index + 1}</td>
                    <td className="px-4 py-4">
                      <div className="font-bold text-slate-900 dark:text-white uppercase truncate max-w-[250px]" title={company.name}>
                        {company.name}
                      </div>
                    </td>
                    <td className="px-4 py-4 font-mono text-slate-600 dark:text-slate-400">{company.tin}</td>
                    
                    {/* Invoices Stats */}
                    <td className="px-2 py-4 text-center font-bold border-l border-slate-200 dark:border-white/5 underline decoration-slate-300 dark:decoration-white/10 underline-offset-4">{company.stats.invoices.total}</td>
                    <td className="px-2 py-4 text-center text-emerald-600 dark:text-emerald-400 font-bold">{company.stats.invoices.signed}</td>
                    <td className="px-2 py-4 text-center">
                      <span className={cn(company.stats.invoices.pending > 0 && "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full font-bold")}>
                        {company.stats.invoices.pending}
                      </span>
                    </td>
                    <td className="px-2 py-4 text-center text-slate-400">{company.stats.invoices.cancelled}</td>
                    <td className="px-2 py-4 text-center text-red-500">{company.stats.invoices.rejected}</td>

                    {/* POA Stats */}
                    <td className="px-2 py-4 text-center font-bold border-l border-slate-200 dark:border-white/5 underline decoration-slate-300 dark:decoration-white/10 underline-offset-4">{company.stats.poa.total}</td>
                    <td className="px-2 py-4 text-center text-emerald-600 dark:text-emerald-400 font-bold">{company.stats.poa.signed}</td>
                    <td className="px-2 py-4 text-center">
                      <span className={cn(company.stats.poa.pending > 0 && "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full font-bold")}>
                        {company.stats.poa.pending}
                      </span>
                    </td>
                    <td className="px-2 py-4 text-center text-slate-400">{company.stats.poa.cancelled}</td>
                    <td className="px-2 py-4 text-center text-red-500">{company.stats.poa.rejected}</td>

                    {/* Contracts Stats */}
                    <td className="px-2 py-4 text-center font-bold border-l border-slate-200 dark:border-white/5 underline decoration-slate-300 dark:decoration-white/10 underline-offset-4">{company.stats.contracts.total}</td>
                    <td className="px-2 py-4 text-center text-emerald-600 dark:text-emerald-400 font-bold">{company.stats.contracts.signed}</td>
                    <td className="px-2 py-4 text-center">
                      <span className={cn(company.stats.contracts.pending > 0 && "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full font-bold")}>
                        {company.stats.contracts.pending}
                      </span>
                    </td>
                    <td className="px-2 py-4 text-center text-slate-400">{company.stats.contracts.cancelled}</td>
                    <td className="px-2 py-4 text-center text-red-500">{company.stats.contracts.rejected}</td>
                  </tr>
                ))
              )}
            </tbody>
            {/* Summary Row */}
            {!loading && filteredCompanies.length > 0 && (
              <tfoot className="bg-slate-50 dark:bg-white/[0.04] border-t-2 border-slate-200 dark:border-white/10 font-black text-slate-900 dark:text-white uppercase tracking-tighter">
                <tr>
                  <td colSpan={2} className="px-4 py-4 text-right">Totals:</td>
                  <td className="px-4 py-4 text-center font-mono">X</td>
                  
                  {/* Invoices Totals */}
                  <td className="px-2 py-4 text-center border-l border-slate-200 dark:border-white/5">{totals.invoices.total}</td>
                  <td className="px-2 py-4 text-center">{totals.invoices.signed}</td>
                  <td className="px-2 py-4 text-center">{totals.invoices.pending}</td>
                  <td className="px-2 py-4 text-center">{totals.invoices.cancelled}</td>
                  <td className="px-2 py-4 text-center">{totals.invoices.rejected}</td>

                  {/* POA Totals */}
                  <td className="px-2 py-4 text-center border-l border-slate-200 dark:border-white/5">{totals.poa.total}</td>
                  <td className="px-2 py-4 text-center">{totals.poa.signed}</td>
                  <td className="px-2 py-4 text-center">{totals.poa.pending}</td>
                  <td className="px-2 py-4 text-center">{totals.poa.cancelled}</td>
                  <td className="px-2 py-4 text-center">{totals.poa.rejected}</td>

                  {/* Contracts Totals */}
                  <td className="px-2 py-4 text-center border-l border-slate-200 dark:border-white/5">{totals.contracts.total}</td>
                  <td className="px-2 py-4 text-center">{totals.contracts.signed}</td>
                  <td className="px-2 py-4 text-center">{totals.contracts.pending}</td>
                  <td className="px-2 py-4 text-center">{totals.contracts.cancelled}</td>
                  <td className="px-2 py-4 text-center">{totals.contracts.rejected}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>
    </div>
  );
}


