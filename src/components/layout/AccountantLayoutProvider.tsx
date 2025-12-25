"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import AccountantTopBar from "@/components/layout/AccountantTopBar";
import AccountantSidebar from "@/components/layout/AccountantSidebar";
import { useRouter } from "next/navigation";
import apiClient from "@/lib/api-client";
import { cn } from "@/lib/utils";

interface AccountantLayoutContextType {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  closeSidebar: () => void;
  openSidebar: () => void;
  selectedCompanyId: string | null;
  setSelectedCompanyId: (id: string | null) => void;
}

const AccountantLayoutContext = createContext<AccountantLayoutContextType | undefined>(undefined);

export const useAccountantLayout = () => {
  const context = useContext(AccountantLayoutContext);
  if (!context) throw new Error("useAccountantLayout must be used within AccountantLayoutProvider");
  return context;
};

export const AccountantLayoutProvider = ({ children }: { children: ReactNode }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(null);
  const router = useRouter();

  const toggleSidebar = () => setIsSidebarOpen(prev => !prev);
  const closeSidebar = () => setIsSidebarOpen(false);
  const openSidebar = () => setIsSidebarOpen(true);

  // Check if user is accountant on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await apiClient.get("/auth/me");
        const session = res.data?.session;
        if (!session || session.role !== "ACCOUNTANT") {
          router.push("/login");
        }
      } catch {
        router.push("/login");
      }
    };
    checkAuth();
  }, [router]);

  return (
    <AccountantLayoutContext.Provider value={{ isSidebarOpen, toggleSidebar, closeSidebar, openSidebar, selectedCompanyId, setSelectedCompanyId }}>
      <div className="min-h-screen bg-[#F8F9FD] dark:bg-[#0a0b14] flex">
        <AccountantSidebar />
        <div 
          className={cn(
            "flex-1 flex flex-col min-w-0 transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]",
            isSidebarOpen ? "pl-20" : "pl-0"
          )}
        >
          <AccountantTopBar />
          <main className="pt-16 p-4 sm:p-6 lg:p-8 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </AccountantLayoutContext.Provider>
  );
};

