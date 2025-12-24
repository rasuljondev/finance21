import React from "react";
import { Info } from "lucide-react";
import { DashboardCard } from "./DashboardCard";

export function DebtorCreditorWidget() {
  return (
    <DashboardCard 
      title="Debtor - Creditor"
      headerAction={
        <div className="flex items-center gap-2">
          <button className="px-4 py-1.5 bg-blue-600 text-white text-[10px] rounded-lg font-black uppercase tracking-widest shadow-lg shadow-blue-500/20 active:scale-95 transition-all">
            Current
          </button>
          <button className="px-4 py-1.5 text-slate-400 dark:text-slate-500 text-[10px] rounded-lg font-black uppercase tracking-widest flex items-center gap-1 hover:text-slate-900 dark:hover:text-white transition-colors">
            Overdue
            <Info className="w-3 h-3" />
          </button>
        </div>
      }
    >
      <div className="flex items-center justify-center py-4">
        <div className="relative w-36 h-36">
          <svg className="w-36 h-36 transform -rotate-90">
            <circle
              cx="72"
              cy="72"
              r="64"
              stroke="currentColor"
              strokeWidth="12"
              fill="none"
              className="text-slate-100 dark:text-white/5"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-2xl font-black text-slate-900 dark:text-white">0</span>
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total</span>
          </div>
        </div>
      </div>
      
      <div className="flex items-center justify-center gap-6 mt-6">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.4)]"></div>
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Debtors</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]"></div>
          <span className="text-xs font-bold text-slate-500 dark:text-slate-400">Creditors</span>
        </div>
      </div>
    </DashboardCard>
  );
}

