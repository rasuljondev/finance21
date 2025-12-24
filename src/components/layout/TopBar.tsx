"use client";

import React, { useState, useEffect } from "react";
import { Menu, ArrowLeft, Youtube, Send, Globe, ChevronDown, DollarSign, RefreshCw } from "lucide-react";
import { useAppLayout } from "./AppLayoutProvider";
import { useAuth } from "@/contexts/AuthContext";
import { getAllCurrencyRates, formatCurrency, type CurrencyRate } from "@/lib/currency";

export default function TopBar() {
  const { toggleSidebar } = useAppLayout();
  const { company, person } = useAuth();
  const [currencyRates, setCurrencyRates] = useState<CurrencyRate[]>([]);
  const [currentCurrencyIndex, setCurrentCurrencyIndex] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Fetch currency rates on mount and every 5 seconds
  useEffect(() => {
    const fetchRates = async () => {
      try {
        const rates = await getAllCurrencyRates();
        setCurrencyRates(rates);
      } catch (err) {
        console.error("Error fetching currency rates:", err);
      }
    };

    fetchRates();
    const interval = setInterval(fetchRates, 5 * 1000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  // Rotate currencies every 5 seconds
  useEffect(() => {
    if (currencyRates.length === 0) return;

    const interval = setInterval(() => {
      setCurrentCurrencyIndex((prev) => (prev + 1) % currencyRates.length);
    }, 5000); // Rotate every 5 seconds

    return () => clearInterval(interval);
  }, [currencyRates.length]);

  const handleRefreshRates = async () => {
    setIsRefreshing(true);
    try {
      const rates = await getAllCurrencyRates();
      setCurrencyRates(rates);
    } catch (err) {
      console.error("Error refreshing currency rates:", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  const currentRate = currencyRates[currentCurrencyIndex] || null;

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

        {/* Company Name & Director */}
        {company && (
          <div className="hidden lg:flex items-center gap-4 pl-6 border-l border-slate-200 dark:border-white/10">
            <div className="flex flex-col">
              <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tight">
                Company
              </span>
              <span className="text-sm font-black text-slate-900 dark:text-white leading-none mt-0.5 uppercase">
                {company.name.toUpperCase()}
              </span>
            </div>
            {person && (
              <div className="flex flex-col">
                <span className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tight">
                  Director
                </span>
                <span className="text-sm font-bold text-blue-600 dark:text-blue-400 leading-none mt-0.5 uppercase">
                  {person.fullName.toUpperCase()}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center gap-6">
        {/* Currency Display - Rotating */}
        {currentRate && (
          <div className="hidden lg:flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-500/10 dark:to-indigo-500/10 rounded-xl border border-blue-200 dark:border-blue-500/20 transition-all duration-500">
            <DollarSign className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 uppercase">
              {currentRate.label}:
            </span>
            <span className="text-sm font-black text-blue-900 dark:text-blue-100">
              {formatCurrency(currentRate.rate)}
            </span>
            <button
              onClick={handleRefreshRates}
              disabled={isRefreshing}
              className="ml-1 p-1 hover:bg-blue-100 dark:hover:bg-blue-500/20 rounded transition-colors disabled:opacity-50"
              title="Refresh exchange rates"
            >
              <RefreshCw
                className={`w-3 h-3 text-blue-600 dark:text-blue-400 ${isRefreshing ? "animate-spin" : ""}`}
              />
            </button>
          </div>
        )}

        {/* Social & Tools */}
        <div className="hidden sm:flex items-center gap-1 text-slate-400">
          <button className="p-2 hover:text-slate-900 dark:hover:text-white transition-colors">
            <Youtube className="w-5 h-5" />
          </button>
          <button className="p-2 hover:text-slate-900 dark:hover:text-white transition-colors">
            <Send className="w-5 h-5" />
          </button>
          <button className="p-2 hover:text-slate-900 dark:hover:text-white transition-colors">
            <Globe className="w-5 h-5" />
          </button>
        </div>

        {/* User Profile */}
        {company && (
          <div className="flex items-center gap-3 pl-6 border-l border-slate-200 dark:border-white/10 group cursor-pointer">
            <div className="text-right hidden xs:block">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">STIR</div>
              <div className="text-sm font-black text-slate-900 dark:text-white leading-none mt-0.5">
                {company.tin}
              </div>
            </div>
            <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-slate-600 dark:text-slate-300 font-bold group-hover:bg-slate-200 dark:group-hover:bg-white/10 transition-colors">
              {company.tin.substring(0, 2)}
            </div>
            <ChevronDown className="w-4 h-4 text-slate-400 group-hover:text-slate-900 dark:group-hover:text-white transition-colors" />
          </div>
        )}
      </div>
    </header>
  );
}
