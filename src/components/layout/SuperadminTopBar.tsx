"use client";

import React from "react";
import { LogOut, Sun, Moon } from "lucide-react";
import { useRouter } from "next/navigation";
import apiClient from "@/lib/api-client";
import { useAlert } from "@/components/ui/AlertProvider";
import ThemeToggle from "@/components/ThemeToggle";

export default function SuperadminTopBar() {
  const router = useRouter();
  const { showSuccess, showError } = useAlert();

  const handleLogout = async () => {
    try {
      await apiClient.post("/auth/logout");
      showSuccess("Logged out successfully");
      router.push("/superadmin/login");
    } catch (error) {
      showError("Failed to logout");
      // Still redirect even if logout fails
      router.push("/superadmin/login");
    }
  };

  return (
    <header className="h-16 bg-white/80 dark:bg-[#111322]/80 backdrop-blur-md border-b border-slate-200 dark:border-white/5 sticky top-0 z-40 px-4 flex items-center justify-between transition-colors">
      <div className="flex items-center gap-4">
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

      <div className="flex items-center gap-4">
        {/* Theme Toggle */}
        <ThemeToggle />

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/30 transition-all border border-red-200 dark:border-red-800"
        >
          <LogOut className="w-4 h-4" />
          <span className="font-bold text-sm">Logout</span>
        </button>
      </div>
    </header>
  );
}

