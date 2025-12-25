"use client";

import React from "react";
import { Menu } from "lucide-react";
import { useSuperadminLayout } from "./SuperadminLayoutProvider";

export default function SuperadminTopBar() {
  const { toggleSidebar } = useSuperadminLayout();

  return (
    <header className="h-16 bg-white/80 dark:bg-[#111322]/80 backdrop-blur-md border-b border-slate-200 dark:border-white/5 sticky top-0 z-40 px-4 flex items-center justify-between transition-colors">
      <div className="flex items-center gap-4">
        {/* Hamburger Menu - Outside the sidebar */}
        <button
          onClick={toggleSidebar}
          className="p-2.5 rounded-xl text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 transition-all"
          aria-label="Open menu"
        >
          <Menu className="w-6 h-6" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center shadow-lg shadow-red-500/20">
            <span className="text-white font-black text-xl">SA</span>
          </div>
          <div className="flex flex-col -gap-1">
            <span className="text-lg font-black text-slate-900 dark:text-white tracking-tighter leading-none">
              SUPERADMIN
            </span>
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none mt-1">
              Finance21 Admin
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}

