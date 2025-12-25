"use client";

import React from "react";
import { LayoutDashboard } from "lucide-react";
import { useAccountantLayout } from "@/components/layout/AccountantLayoutProvider";

export default function AccountantDashboardPage() {
  const { selectedCompanyId } = useAccountantLayout();

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <LayoutDashboard className="w-8 h-8 text-blue-600" />
            Dashboard
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
            {selectedCompanyId === "all" 
              ? "Viewing all companies" 
              : selectedCompanyId 
              ? "Viewing selected company" 
              : "Select a company to view"}
          </p>
        </div>
      </div>

      <div className="bg-white dark:bg-[#111322] rounded-3xl border border-slate-200 dark:border-white/5 p-12 text-center">
        <LayoutDashboard className="w-16 h-16 text-slate-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Accountant Dashboard</h2>
        <p className="text-slate-600 dark:text-slate-400">
          Select a company from the dropdown above to view its data, or choose "All Companies" to see all documents.
        </p>
      </div>
    </div>
  );
}

