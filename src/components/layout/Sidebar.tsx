"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { 
  LayoutDashboard, 
  Database, 
  Download, 
  Upload, 
  Settings, 
  LogOut 
} from "lucide-react";
import { useAppLayout } from "./AppLayoutProvider";
import { useAuth } from "@/contexts/AuthContext";
import ThemeToggle from "@/components/ThemeToggle";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/app/dashboard", icon: LayoutDashboard },
  { href: "/app/data", icon: Database },
  { href: "/app/trade/incoming", icon: Download },
  { href: "/app/trade/outgoing", icon: Upload },
  { href: "/app/settings", icon: Settings },
];

export default function Sidebar() {
  const { isSidebarOpen, closeSidebar } = useAppLayout();
  const [isHovered, setIsHovered] = useState(false);
  const pathname = usePathname();
  const { logout } = useAuth();

  // Track previous state to detect when manually closed
  const [prevIsSidebarOpen, setPrevIsSidebarOpen] = useState(isSidebarOpen);
  useEffect(() => {
    // If sidebar was manually open and is now closed, clear hover to prevent immediate re-opening
    if (prevIsSidebarOpen && !isSidebarOpen) {
      setIsHovered(false);
    }
    setPrevIsSidebarOpen(isSidebarOpen);
  }, [isSidebarOpen, prevIsSidebarOpen]);

  // Sidebar is expanded if manually opened OR if hovered (when not manually opened)
  // When manually opened, hover doesn't matter - it stays open until manually closed
  const isExpanded = isSidebarOpen || (!isSidebarOpen && isHovered);

  return (
    <>
      {/* Invisible hover trigger zone when sidebar is hidden and not manually open */}
      {!isSidebarOpen && (
        <div 
          className="fixed left-0 top-0 w-2 h-screen z-[60]"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        />
      )}

      {/* Main Sidebar - STRICTLY ICONS ONLY - NO LABELS */}
      <aside
        onMouseEnter={() => !isSidebarOpen && setIsHovered(true)}
        onMouseLeave={() => !isSidebarOpen && setIsHovered(false)}
        className={cn(
          "fixed top-0 left-0 h-screen bg-[#111322] border-r border-white/5 z-50 transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] w-20",
          isExpanded ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex flex-col h-full py-6 items-center">
          {/* Top spacer for the hamburger button area */}
          <div className="h-16 mb-4" />

          {/* Navigation Items - ICONS ONLY */}
          <nav className="flex-1 flex flex-col gap-4 w-full px-3">
            {navItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "relative group flex items-center justify-center p-3 rounded-2xl transition-all duration-300",
                    isActive 
                      ? "bg-blue-600 text-white shadow-xl shadow-blue-500/30 ring-4 ring-blue-600/10" 
                      : "text-slate-500 hover:bg-white/5 hover:text-slate-200"
                  )}
                >
                  <Icon className="w-6 h-6" strokeWidth={isActive ? 2.5 : 2} />
                </Link>
              );
            })}
          </nav>

          {/* Bottom Actions - ICONS ONLY */}
          <div className="w-full px-3 flex flex-col gap-4 mt-auto">
            <div className="flex justify-center p-1 rounded-2xl bg-white/5">
              <ThemeToggle />
            </div>
            
            <button
              onClick={logout}
              className="group relative flex items-center justify-center p-3 rounded-2xl text-slate-500 hover:bg-red-500/10 hover:text-red-500 transition-all duration-300"
            >
              <LogOut className="w-6 h-6" />
            </button>
          </div>
        </div>
      </aside>

      {/* Backdrop for small screens when sidebar is manually toggled */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeSidebar}
            className="fixed inset-0 bg-slate-950/20 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>
    </>
  );
}
