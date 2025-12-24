"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import Sidebar from "@/components/layout/Sidebar";
import TopBar from "@/components/layout/TopBar";
import { cn } from "@/lib/utils";

interface LayoutContextType {
  isSidebarOpen: boolean;
  toggleSidebar: () => void;
  closeSidebar: () => void;
  openSidebar: () => void;
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

export const useAppLayout = () => {
  const context = useContext(LayoutContext);
  if (!context) throw new Error("useAppLayout must be used within AppLayoutProvider");
  return context;
};

export const AppLayoutProvider = ({ children }: { children: ReactNode }) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const toggleSidebar = () => setIsSidebarOpen(prev => !prev);
  const closeSidebar = () => setIsSidebarOpen(false);
  const openSidebar = () => setIsSidebarOpen(true);

  return (
    <LayoutContext.Provider value={{ isSidebarOpen, toggleSidebar, closeSidebar, openSidebar }}>
      <div className="min-h-screen bg-[#F8F9FD] dark:bg-[#0a0b14] flex">
        <Sidebar />
        <div 
          className={cn(
            "flex-1 flex flex-col min-w-0 transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)]",
            isSidebarOpen ? "pl-20" : "pl-0"
          )}
        >
          <TopBar />
          <main className="pt-16 p-4 sm:p-6 lg:p-8 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </LayoutContext.Provider>
  );
};

