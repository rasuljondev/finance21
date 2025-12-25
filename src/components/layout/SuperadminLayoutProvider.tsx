"use client";

import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import SuperadminTopBar from "@/components/layout/SuperadminTopBar";
import { useRouter } from "next/navigation";
import apiClient from "@/lib/api-client";

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
      <div className="min-h-screen bg-[#F8F9FD] dark:bg-[#0a0b14] flex flex-col">
        <SuperadminTopBar />
        <main className="pt-16 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </SuperadminLayoutContext.Provider>
  );
};

