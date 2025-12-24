import React from "react";
import { RefreshCw, TrendingUp, TrendingDown } from "lucide-react";
import { DashboardCard } from "./DashboardCard";
import { Input } from "@/components/ui/Input";

export function RelationshipWidget() {
  return (
    <DashboardCard 
      title="Relationships" 
      headerAction={
        <button className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-colors">
          <RefreshCw className="w-4 h-4 text-slate-500" />
        </button>
      }
    >
      <div className="mb-4">
        <span className="px-3 py-1 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-lg text-xs font-bold border border-amber-100 dark:border-amber-500/20">
          Passive
        </span>
      </div>
      
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-slate-50 dark:bg-white/5 rounded-2xl p-4 border border-slate-100 dark:border-white/5 group hover:border-emerald-500/30 transition-colors">
          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase mb-1">
            <TrendingUp className="w-3 h-3 text-emerald-500" />
            Incoming
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white group-hover:text-emerald-500 transition-colors">0</div>
        </div>
        <div className="bg-slate-50 dark:bg-white/5 rounded-2xl p-4 border border-slate-100 dark:border-white/5 group hover:border-red-500/30 transition-colors">
          <div className="flex items-center gap-2 text-[10px] font-bold text-slate-400 uppercase mb-1">
            <TrendingDown className="w-3 h-3 text-red-500" />
            Outgoing
          </div>
          <div className="text-xl font-black text-slate-900 dark:text-white group-hover:text-red-500 transition-colors">0</div>
        </div>
      </div>

      <div className="space-y-4">
        <Input
          placeholder="Date/Number"
          inputSize="sm"
        />
        <Input
          placeholder="Name"
          inputSize="sm"
        />
      </div>
    </DashboardCard>
  );
}

