import React from "react";
import { DollarSign } from "lucide-react";
import { DashboardCard } from "./DashboardCard";
import { StatCard } from "./StatCard";

export function CashBalanceWidget() {
  const stats = [
    { label: "Opening Balance", value: "0", color: "blue" },
    { label: "Income", value: "0", color: "emerald" },
    { label: "Expense", value: "0", color: "red" },
    { label: "Closing Balance", value: "0", color: "purple" },
  ] as const;

  return (
    <DashboardCard 
      title="Cash Balance" 
      icon={<DollarSign className="w-6 h-6" />}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((item, i) => (
          <StatCard 
            key={i} 
            label={item.label} 
            value={item.value} 
            color={item.color} 
          />
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-slate-100 dark:border-white/5">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-white/5 border-b border-slate-100 dark:border-white/5">
              <tr>
                {["#", "Account Number", "Bank", "Opening Balance", "Income", "Expense", "Closing Balance", "Transaction", "Status"].map((header) => (
                  <th key={header} className="px-4 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              <tr className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors">
                <td colSpan={9} className="px-4 py-12 text-center text-slate-400 italic font-medium">
                  No data available
                </td>
              </tr>
              <tr className="bg-slate-50/50 dark:bg-white/5 font-bold">
                <td className="px-4 py-4 text-slate-900 dark:text-white" colSpan={3}>Total:</td>
                <td className="px-4 py-4 text-slate-900 dark:text-white">0</td>
                <td className="px-4 py-4 text-slate-900 dark:text-white">0</td>
                <td className="px-4 py-4 text-slate-900 dark:text-white">0</td>
                <td className="px-4 py-4 text-slate-900 dark:text-white">0</td>
                <td className="px-4 py-4" colSpan={2}></td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </DashboardCard>
  );
}

