import React from "react";
import { RefreshCw, Filter } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface DashboardHeaderProps {
  onRefresh: () => void;
  loading: boolean;
}

export function DashboardHeader({ onRefresh, loading }: DashboardHeaderProps) {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">
          Accounting Information
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
          Financial Reports and Statistics
          <span className="ml-2 px-2 py-0.5 bg-slate-100 dark:bg-white/5 rounded text-[10px] font-bold">
            01.01.2025 - 24.12.2025
          </span>
        </p>
      </div>
      <div className="flex items-center gap-2">
        <button 
          onClick={onRefresh}
          className={`p-2.5 rounded-xl bg-white dark:bg-[#111322] border border-slate-200 dark:border-white/5 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/10 transition-all ${loading ? 'animate-spin' : ''}`}
        >
          <RefreshCw className="w-5 h-5" />
        </button>
        <Button 
          variant="primary" 
          leftIcon={<Filter className="w-4 h-4" />}
          className="px-5 py-2.5"
        >
          Filter
        </Button>
      </div>
    </div>
  );
}

