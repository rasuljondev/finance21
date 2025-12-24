import React, { useState, useEffect } from "react";
import { DashboardCard } from "./DashboardCard";
import { cn } from "@/lib/utils";

export function TaskCalendarWidget() {
  const [displayDate, setDisplayDate] = useState(new Date());
  
  useEffect(() => {
    // Current fixed date for demo
    setDisplayDate(new Date(2025, 11, 24));
  }, []);

  const monthNames = [
    'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun', 
    'Iyul', 'Avgust', 'Sentyabr', 'Oktyabr', 'Noyabr', 'Dekabr'
  ];
  
  const currentMonth = `${monthNames[displayDate.getMonth()]} ${displayDate.getFullYear()}`;
  const daysInMonth = new Date(displayDate.getFullYear(), displayDate.getMonth() + 1, 0).getDate();
  const firstDayOfMonth = new Date(displayDate.getFullYear(), displayDate.getMonth(), 1).getDay();
  const currentDay = displayDate.getDate();

  const days = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  return (
    <DashboardCard title="Tasks Calendar">
      <div className="text-xs font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-4">
        {currentMonth}
      </div>
      
      <div className="grid grid-cols-7 gap-1 mb-2">
        {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
          <div key={idx} className="text-center text-[10px] text-slate-400 font-black py-1 uppercase">
            {day}
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, idx) => (
          <div
            key={idx}
            className={cn(
              "aspect-square flex items-center justify-center text-xs rounded-xl transition-all font-bold",
              day === currentDay
                ? "bg-blue-600 text-white font-black shadow-lg shadow-blue-500/30 scale-110"
                : day
                ? "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-white/10"
                : "text-transparent"
            )}
          >
            {day}
          </div>
        ))}
      </div>
    </DashboardCard>
  );
}

