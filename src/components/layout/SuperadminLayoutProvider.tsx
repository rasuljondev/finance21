"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import SuperadminTopBar from "@/components/layout/SuperadminTopBar";
import SuperadminSidebar from "@/components/layout/SuperadminSidebar";
import { useRouter } from "next/navigation";
import apiClient from "@/lib/api-client";
import { cn } from "@/lib/utils";

interface SuperadminLayoutContextType {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  closeSidebar: () => void;
  openSidebar: () => void;
}

const SuperadminLayoutContext = createContext<SuperadminLayoutContextType | undefined>(undefined);

export const useSuperadminLayout = () => {
  const context = useContext(SuperadminLayoutContext);
  if (!context) throw new Error("useSuperadminLayout must be used within SuperadminLayoutProvider");
  return context;
};

export const SuperadminLayoutProvider = ({ children }: { children: ReactNode }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const router = useRouter();

  const toggleSidebar = () => setIsSidebarOpen(prev => !prev);
  const closeSidebar = () => setIsSidebarOpen(false);
  const openSidebar = () => setIsSidebarOpen(true);

  // Check if user is superadmin on mount
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await apiClient.get("/auth/me");
        const session = res.data?.session;
        if (!session || session.role !== "SUPERADMIN") {
          router.push("/login");
        }
      } catch {
        router.push("/login");
      }
    };
    checkAuth();
  }, [router]);

  return (
    <SuperadminLayoutContext.Provider value={{ isSidebarOpen, toggleSidebar, closeSidebar, openSidebar }}>
      <div className="min-h-screen bg-[#F8F9FD] dark:bg-[#0a0b14] flex">
        <SuperadminSidebar />
        <div 
          className={cn(
            "flex-1 flex flex-col min-w-0 transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]",
            isSidebarOpen ? "pl-20" : "pl-0"
          )}
        >
          <SuperadminTopBar />
          <main className="pt-16 p-4 sm:p-6 lg:p-8 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </SuperadminLayoutContext.Provider>
  );
};

