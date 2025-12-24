import React from "react";
import { cn } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: string | number;
  color: "blue" | "emerald" | "red" | "purple" | "amber";
  className?: string;
}

export function StatCard({ label, value, color, className }: StatCardProps) {
  const colorStyles = {
    blue: "bg-blue-50/50 dark:bg-blue-500/5 text-blue-600 dark:text-blue-400 border-blue-100/50 dark:border-blue-500/10",
    emerald: "bg-emerald-50/50 dark:bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 border-emerald-100/50 dark:border-emerald-500/10",
    red: "bg-red-50/50 dark:bg-red-500/5 text-red-600 dark:text-red-400 border-red-100/50 dark:border-red-500/10",
    purple: "bg-purple-50/50 dark:bg-purple-500/5 text-purple-600 dark:text-purple-400 border-purple-100/50 dark:border-purple-500/10",
    amber: "bg-amber-50/50 dark:bg-amber-500/5 text-amber-600 dark:text-amber-400 border-amber-100/50 dark:border-amber-500/10",
  };

  return (
    <div className={cn(
      "rounded-2xl p-5 border transition-all hover:shadow-md",
      colorStyles[color],
      className
    )}>
      <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-2">
        {label}
      </div>
      <div className="text-2xl font-black text-slate-900 dark:text-white">
        {value}
      </div>
    </div>
  );
}

