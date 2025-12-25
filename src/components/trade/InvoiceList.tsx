"use client";

import React, { useState, useEffect } from "react";
import { 
  Search, 
  RefreshCw, 
  Download, 
  Printer, 
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { cn } from "@/lib/utils";
import { Invoice, InvoiceStatus } from "@/types/invoice";
import { useAlert } from "@/components/ui/AlertProvider";

import { useAuth } from "@/contexts/AuthContext";
import apiClient from "@/lib/api-client";
import { useAccountantLayout } from "@/components/layout/AccountantLayoutProvider";

interface InvoiceListProps {
  title: string;
  type: "incoming" | "outgoing";
}

export function InvoiceList({ title, type }: InvoiceListProps) {
  const { showSuccess, showError } = useAlert();
  const { company } = useAuth();
  const accountantLayout = (() => {
    try {
      return useAccountantLayout();
    } catch {
      return null;
    }
  })();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus>("all");

  const filteredInvoices = invoices.filter(invoice => {
    // Search filter
    const matchesSearch = !searchQuery || 
      invoice.counterpartyName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.counterpartyStir?.includes(searchQuery) ||
      invoice.number?.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;

    // Status filter
    if (statusFilter === 'all') return true;
    if (statusFilter === 'waiting') return invoice.status === 'PENDING';
    if (statusFilter === 'signed') return invoice.status === 'SIGNED';
    if (statusFilter === 'rejected') return invoice.status === 'REJECTED';
    if (statusFilter === 'deleted') return invoice.status === 'CANCELLED';
    
    return true;
  });

  const fetchInvoices = async () => {
    // For accountants, don't require company from auth
    if (!accountantLayout && !company) return;
    
    setLoading(true);
    try {
      const direction = type === "incoming" ? "INCOMING" : "OUTGOING";
      const params: any = {
        direction,
        search: searchQuery || undefined,
      };
      
      // Add companyId filter for accountants
      if (accountantLayout?.selectedCompanyId && accountantLayout.selectedCompanyId !== "all") {
        params.companyId = accountantLayout.selectedCompanyId;
      }
      
      const response = await apiClient.get("/documents", { params });
      setInvoices(response.data?.documents || []);
    } catch (err: any) {
      console.error(`Error fetching ${type} invoices:`, err);
      showError(`Failed to load ${type} invoices`);
      setInvoices([]); // Clear on error
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [type, company, searchQuery, accountantLayout?.selectedCompanyId]);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const direction = type === "incoming" ? "INCOMING" : "OUTGOING";
      await apiClient.post("/documents/sync", { direction });
      showSuccess("Successfully synced with Didox");
      await fetchInvoices();
    } catch (err) {
      showError("Failed to sync with Didox. Please login with E-IMZO again if needed.");
    } finally {
      setSyncing(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const s = status.toUpperCase();
    if (s === 'SIGNED') {
      return (
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-wider border border-emerald-100 dark:border-emerald-500/20">
          <CheckCircle2 className="w-3 h-3" />
          Имзоланган
        </div>
      );
    }
    if (s === 'PENDING') {
      return (
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 text-[10px] font-bold uppercase tracking-wider border border-amber-100 dark:border-amber-500/20">
          <Clock className="w-3 h-3" />
          Кутилмоқда
        </div>
      );
    }
    if (s === 'REJECTED') {
      return (
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-[10px] font-bold uppercase tracking-wider border border-red-100 dark:border-red-500/20">
          <XCircle className="w-3 h-3" />
          Рад этилган
        </div>
      );
    }
    if (s === 'CANCELLED') {
      return (
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider border border-slate-100 dark:border-white/10">
          <XCircle className="w-3 h-3" />
          Бекор қилинган
        </div>
      );
    }
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-50 dark:bg-white/5 text-slate-600 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider border border-slate-100 dark:border-white/10">
        <AlertCircle className="w-3 h-3" />
        {status}
      </div>
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("uz-UZ", {
      style: "decimal",
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight flex items-center gap-3">
            <FileText className="w-8 h-8 text-blue-600" />
            {title}
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 font-medium">
            Managing invoices for <span className="text-blue-600 dark:text-blue-400 font-bold">{company?.name || 'Company'}</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleSync}
            isLoading={syncing}
            leftIcon={<RefreshCw className={cn("w-4 h-4", syncing && "animate-spin")} />}
          >
            Didox Sync
          </Button>
          <Button 
            variant="primary" 
            leftIcon={<Download className="w-4 h-4" />}
          >
            Export
          </Button>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="bg-white dark:bg-[#111322] rounded-3xl border border-slate-200 dark:border-white/5 p-4 shadow-sm space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center gap-4">
          <div className="flex-1">
            <Input
              placeholder="Search by counterparty, TIN or document number..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search className="w-4 h-4" />}
            />
          </div>
          <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0 scrollbar-hide">
            {[
              { id: 'all', label: 'All' },
              { id: 'waiting', label: 'Waiting' },
              { id: 'signed', label: 'Signed' },
              { id: 'rejected', label: 'Rejected' },
              { id: 'deleted', label: 'Deleted' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id as InvoiceStatus)}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border",
                  statusFilter === tab.id
                    ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-500/20"
                    : "bg-slate-50 dark:bg-white/5 text-slate-500 dark:text-slate-400 border-transparent hover:bg-slate-100 dark:hover:bg-white/10"
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white dark:bg-[#111322] rounded-3xl border border-slate-200 dark:border-white/5 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 dark:bg-white/5 border-b border-slate-100 dark:border-white/5">
              <tr>
                <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Document</th>
                <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  {type === "incoming" ? "Seller (Supplier)" : "Buyer (Customer)"}
                </th>
                <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Contract</th>
                <th className="px-6 py-4 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest">VAT</th>
                <th className="px-6 py-4 text-right text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Amount</th>
                <th className="px-6 py-4 text-center text-[10px] font-bold text-slate-400 uppercase tracking-widest">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/5">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <RefreshCw className="w-8 h-8 animate-spin text-blue-600" />
                      <span className="text-slate-400 font-medium">Loading invoices...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 bg-slate-50 dark:bg-white/5 rounded-2xl flex items-center justify-center text-slate-300">
                        <FileText className="w-8 h-8" />
                      </div>
                      <span className="text-slate-400 font-medium italic">No invoices found</span>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((invoice) => (
                  <tr 
                    key={invoice.id} 
                    className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors group"
                  >
                    <td className="px-6 py-4">
                      {getStatusBadge(invoice.status)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900 dark:text-white">
                        № {invoice.number || '—'}
                      </div>
                      <div className="text-[11px] text-slate-400 font-medium">
                        {invoice.date || '—'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-bold text-blue-600 dark:text-blue-400 uppercase tracking-tight truncate max-w-[200px]">
                        {invoice.counterpartyName || '—'}
                      </div>
                      <div className="text-[11px] text-slate-400 font-medium">
                        TIN: {invoice.counterpartyStir || '—'}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-slate-700 dark:text-slate-300 font-medium">
                        № {invoice.contractNumber || '—'}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        {invoice.contractDate || '—'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right text-slate-600 dark:text-slate-400 font-medium">
                      {formatCurrency(invoice.vatAmount || 0)}
                    </td>
                    <td className="px-6 py-4 text-right font-black text-slate-900 dark:text-white">
                      {formatCurrency(invoice.amount)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <button className="p-2 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-xl text-blue-600 dark:text-blue-400 transition-colors">
                        <Printer className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

