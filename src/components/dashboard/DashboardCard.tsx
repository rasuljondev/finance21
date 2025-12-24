import React, { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface DashboardCardProps {
  title?: string;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
  headerAction?: ReactNode;
}

export function DashboardCard({ 
  title, 
  icon, 
  children, 
  className, 
  headerAction 
}: DashboardCardProps) {
  return (
    <div className={cn(
      "bg-white dark:bg-[#111322] rounded-3xl border border-slate-200 dark:border-white/5 p-6 shadow-sm flex flex-col h-full",
      className
    )}>
      {(title || icon || headerAction) && (
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            {icon && (
              <div className="w-10 h-10 bg-blue-50 dark:bg-blue-500/10 rounded-xl flex items-center justify-center text-blue-600 dark:text-blue-400">
                {icon}
              </div>
            )}
            {title && <h2 className="text-lg font-bold text-slate-900 dark:text-white">{title}</h2>}
          </div>
          {headerAction}
        </div>
      )}
      <div className="flex-1">
        {children}
      </div>
    </div>
  );
}

