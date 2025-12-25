"use client";

import React, { useState, useEffect } from "react";
import { Menu, ChevronDown } from "lucide-react";
import { useAccountantLayout } from "./AccountantLayoutProvider";
import apiClient from "@/lib/api-client";

interface Company {
  id: string;
  tin: string;
  name: string;
}

export default function AccountantTopBar() {
  const { toggleSidebar, selectedCompanyId, setSelectedCompanyId } = useAccountantLayout();
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const res = await apiClient.get("/accountant/companies");
        if (res.data.ok) {
          setCompanies(res.data.companies);
          if (res.data.companies.length > 0 && !selectedCompanyId) {
            setSelectedCompanyId("all");
            setSelectedCompany({ id: "all", tin: "ALL", name: "All Companies" });
          } else if (selectedCompanyId) {
            const company = res.data.companies.find((c: Company) => c.id === selectedCompanyId);
            if (company) {
              setSelectedCompany(company);
            } else if (selectedCompanyId === "all") {
              setSelectedCompany({ id: "all", tin: "ALL", name: "All Companies" });
            }
          }
        }
      } catch (err) {
        console.error("Error fetching companies:", err);
      }
    };
    fetchCompanies();
  }, [selectedCompanyId, setSelectedCompanyId]);

  const handleCompanyChange = (companyId: string) => {
    setSelectedCompanyId(companyId);
    if (companyId === "all") {
      setSelectedCompany({ id: "all", tin: "ALL", name: "All Companies" });
    } else {
      const company = companies.find((c) => c.id === companyId);
      if (company) setSelectedCompany(company);
    }
  };

  return (
    <header className="h-16 bg-white/80 dark:bg-[#111322]/80 backdrop-blur-md border-b border-slate-200 dark:border-white/5 sticky top-0 z-40 px-4 flex items-center justify-between transition-colors">
      <div className="flex items-center gap-4">
        <button
          onClick={toggleSidebar}
          className="p-2.5 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-all"
          aria-label="Open menu"
        >
          <Menu className="w-6 h-6" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
            <span className="text-white font-black text-xl">A</span>
          </div>
          <div className="flex flex-col -gap-1">
            <span className="text-lg font-black text-slate-900 dark:text-white tracking-tighter leading-none">
              ACCOUNTANT
            </span>
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none mt-1">
              Finance21
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {selectedCompany && (
          <div className="relative group">
            <button className="flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all border border-blue-200 dark:border-blue-800">
              <span className="font-bold text-sm">Active Company: {selectedCompany.name.toUpperCase()}</span>
              <ChevronDown className="w-4 h-4" />
            </button>
            <div className="absolute right-0 top-full mt-2 w-64 bg-white dark:bg-[#111322] rounded-xl border border-slate-200 dark:border-white/5 shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50">
              <div className="p-2 max-h-64 overflow-y-auto">
                <button
                  onClick={() => handleCompanyChange("all")}
                  className={`w-full text-left p-3 rounded-lg transition-colors ${
                    selectedCompanyId === "all"
                      ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                      : "hover:bg-slate-50 dark:hover:bg-white/10 text-slate-900 dark:text-white"
                  }`}
                >
                  <div className="font-bold">All Companies</div>
                </button>
                {companies.map((company) => (
                  <button
                    key={company.id}
                    onClick={() => handleCompanyChange(company.id)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      selectedCompanyId === company.id
                        ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
                        : "hover:bg-slate-50 dark:hover:bg-white/10 text-slate-900 dark:text-white"
                    }`}
                  >
                    <div className="font-bold">{company.name.toUpperCase()}</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">STIR: {company.tin}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

