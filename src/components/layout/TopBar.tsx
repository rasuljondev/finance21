"use client";

import React from "react";
import { Menu, ArrowLeft, Youtube, Send, Globe, ChevronDown } from "lucide-react";
import { useAppLayout } from "./AppLayoutProvider";
import { useAuth } from "@/contexts/AuthContext";

export default function TopBar() {
  const { toggleSidebar } = useAppLayout();
  const { user } = useAuth();

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

        <button className="hidden md:flex p-2 text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/20">
            <span className="text-white font-black text-xl">F</span>
          </div>
          <div className="flex flex-col -gap-1">
            <span className="text-lg font-black text-slate-900 dark:text-white tracking-tighter leading-none">
              FINANCE21
            </span>
            <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest leading-none mt-1">
              Saas Accounting
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-6">
        {/* Currency Display */}
        <div className="hidden lg:flex items-center gap-2 px-4 py-2 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-100 dark:border-white/5">
          <span className="text-[10px] font-bold text-slate-400 uppercase">1 USD =</span>
          <span className="text-sm font-bold text-slate-900 dark:text-white">12,845.00 UZS</span>
        </div>

        {/* Social & Tools */}
        <div className="hidden sm:flex items-center gap-1 text-slate-400">
          <button className="p-2 hover:text-slate-900 dark:hover:text-white transition-colors"><Youtube className="w-5 h-5" /></button>
          <button className="p-2 hover:text-slate-900 dark:hover:text-white transition-colors"><Send className="w-5 h-5" /></button>
          <button className="p-2 hover:text-slate-900 dark:hover:text-white transition-colors"><Globe className="w-5 h-5" /></button>
        </div>

        {/* User Profile */}
        {user && (
          <div className="flex items-center gap-3 pl-6 border-l border-slate-200 dark:border-white/10 group cursor-pointer">
            <div className="text-right hidden xs:block">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">TAX ID</div>
              <div className="text-sm font-black text-slate-900 dark:text-white leading-none mt-0.5">{user.taxId}</div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold group-hover:bg-slate-200 dark:group-hover:bg-white/10 transition-colors">
              {user.taxId.substring(0, 2)}
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors" />
          </div>
        )}
      </div>
    </header>
  );
}
