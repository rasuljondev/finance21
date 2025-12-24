"use client";

import React, { useState, useEffect } from "react";
import { 
  Search, 
  RefreshCw, 
  Filter, 
  ChevronDown, 
  Download, 
  Printer, 
  X, 
  ChevronLeft,
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

interface InvoiceListProps {
  title: string;
  type: "incoming" | "outgoing";
}

export function InvoiceList({ title, type }: InvoiceListProps) {
  const { showSuccess, showError } = useAlert();
  const { company } = useAuth();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<InvoiceStatus>("all");
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

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
    if (!company) return;
    
    setLoading(true);
    try {
      const direction = type === "incoming" ? "INCOMING" : "OUTGOING";
      const response = await apiClient.get("/documents", {
        params: {
          direction,
          search: searchQuery || undefined,
        },
      });
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
  }, [type, company, searchQuery]);

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
                <th className="px-6 py-4 text-left text-[10px] font-bold text-slate-400 uppercase tracking-widest">Counterparty</th>
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
                    className="hover:bg-slate-50 dark:hover:bg-white/[0.02] transition-colors cursor-pointer group"
                    onClick={() => setSelectedInvoice(invoice)}
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

      {/* Detail Modal */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-300">
          <div className="bg-[#F8F9FD] dark:bg-[#0a0b14] w-full max-w-5xl rounded-[32px] shadow-2xl flex flex-col relative my-8 border border-white/10 overflow-hidden">
            {/* Modal Header */}
            <div className="sticky top-0 z-10 bg-white dark:bg-[#111322] border-b border-slate-200 dark:border-white/5 px-8 py-5 flex items-center justify-between">
              <div className="flex items-center gap-6">
                <button 
                  onClick={() => setSelectedInvoice(null)}
                  className="p-2.5 hover:bg-slate-100 dark:hover:bg-white/5 rounded-2xl transition-all text-slate-500 dark:text-slate-400 flex items-center gap-2 text-sm font-bold active:scale-95"
                >
                  <ChevronLeft className="w-5 h-5" />
                  Back
                </button>
                <div className="h-8 w-px bg-slate-200 dark:bg-white/10" />
                <h2 className="text-lg font-black text-slate-900 dark:text-white truncate max-w-md tracking-tight">
                  Invoice № {selectedInvoice.number}
                </h2>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" leftIcon={<Download className="w-4 h-4" />}>
                  Download
                </Button>
                <Button variant="primary" size="sm" leftIcon={<Printer className="w-4 h-4" />}>
                  Print
                </Button>
                <button 
                  onClick={() => setSelectedInvoice(null)}
                  className="p-2.5 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-2xl transition-all text-slate-400 hover:text-red-500 active:scale-95"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="flex-1 p-8 overflow-y-auto">
              <div className="bg-white dark:bg-[#111322] p-10 rounded-[40px] shadow-xl border border-slate-200 dark:border-white/5 space-y-12">
                {/* Status Section */}
                <div className={cn(
                  "p-6 rounded-[24px] border flex flex-col md:flex-row md:items-center justify-between gap-4",
                  selectedInvoice.status.toLowerCase().includes('рад') 
                    ? "bg-red-50/50 dark:bg-red-500/5 border-red-100 dark:border-red-500/20" 
                    : "bg-emerald-50/50 dark:bg-emerald-500/5 border-emerald-100 dark:border-emerald-500/20"
                )}>
                  <div className="flex items-center gap-4">
                    {getStatusBadge(selectedInvoice.status)}
                    <div className="h-6 w-px bg-slate-200 dark:bg-white/10 hidden md:block" />
                    <span className="text-sm font-bold text-slate-500 dark:text-slate-400">
                      Updated: {selectedInvoice.updatedAt || selectedInvoice.date}
                    </span>
                  </div>
                  {selectedInvoice.didoxData?.status_comment && (
                    <div className="flex items-center gap-2 text-sm font-medium italic text-slate-500">
                      <AlertCircle className="w-4 h-4" />
                      {selectedInvoice.didoxData.status_comment}
                    </div>
                  )}
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                  <div className="space-y-6">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Seller Information</h3>
                    <div className="bg-slate-50 dark:bg-white/[0.02] p-6 rounded-[24px] border border-slate-100 dark:border-white/5 space-y-4">
                      <div className="font-black text-slate-900 dark:text-white text-lg uppercase leading-tight">
                        {selectedInvoice.didoxData?.sellerName || 'Company Name'}
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">TIN</span>
                          <span className="font-bold text-slate-900 dark:text-white">{selectedInvoice.didoxData?.partnerTin || '—'}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-slate-500">Address</span>
                          <span className="font-medium text-slate-900 dark:text-white text-right max-w-[200px]">{selectedInvoice.didoxData?.sellerAddress || '—'}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6 text-right">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Buyer Information</h3>
                    <div className="bg-slate-50 dark:bg-white/[0.02] p-6 rounded-[24px] border border-slate-100 dark:border-white/5 space-y-4 text-right">
                      <div className="font-black text-slate-900 dark:text-white text-lg uppercase leading-tight">
                        {selectedInvoice.didoxData?.buyerName || 'Company Name'}
                      </div>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm flex-row-reverse">
                          <span className="text-slate-500">TIN</span>
                          <span className="font-bold text-slate-900 dark:text-white">{selectedInvoice.didoxData?.partnerTin || '—'}</span>
                        </div>
                        <div className="flex justify-between text-sm flex-row-reverse">
                          <span className="text-slate-500">Address</span>
                          <span className="font-medium text-slate-900 dark:text-white text-left max-w-[200px]">{selectedInvoice.didoxData?.buyerAddress || '—'}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Document Details Table */}
                <div className="space-y-6">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Document Details</h3>
                  <div className="border border-slate-200 dark:border-white/5 rounded-[24px] overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-slate-50 dark:bg-white/5 border-b border-slate-200 dark:border-white/5">
                        <tr>
                          <th className="px-6 py-4 text-left font-bold text-slate-500">Description</th>
                          <th className="px-6 py-4 text-right font-bold text-slate-500">Value</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-white/5">
                        <tr>
                          <td className="px-6 py-4 text-slate-500">Invoice Number & Date</td>
                          <td className="px-6 py-4 text-right font-bold text-slate-900 dark:text-white">№ {selectedInvoice.number} from {selectedInvoice.date}</td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 text-slate-500">Contract Reference</td>
                          <td className="px-6 py-4 text-right font-bold text-slate-900 dark:text-white">№ {selectedInvoice.contractNumber || '—'} from {selectedInvoice.contractDate || '—'}</td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 text-slate-500">Delivery Value</td>
                          <td className="px-6 py-4 text-right font-bold text-slate-900 dark:text-white">{formatCurrency(selectedInvoice.deliveryValue || 0)}</td>
                        </tr>
                        <tr>
                          <td className="px-6 py-4 text-slate-500">VAT Amount</td>
                          <td className="px-6 py-4 text-right font-bold text-slate-900 dark:text-white text-blue-600 dark:text-blue-400">{formatCurrency(selectedInvoice.vatAmount || 0)}</td>
                        </tr>
                        <tr className="bg-slate-50/50 dark:bg-white/5">
                          <td className="px-6 py-5 text-slate-900 dark:text-white font-black text-lg">Total Amount</td>
                          <td className="px-6 py-5 text-right font-black text-slate-900 dark:text-white text-2xl tracking-tighter">{formatCurrency(selectedInvoice.amount)}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Footer Notes */}
                <div className="pt-12 border-t border-slate-100 dark:border-white/5 flex flex-col md:flex-row justify-between items-center gap-6">
                   <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-100 dark:border-white/10">
                      <div className="w-12 h-12 bg-white dark:bg-white/5 rounded-xl border border-slate-200 dark:border-white/10 flex items-center justify-center">
                        <span className="text-[8px] text-slate-300 font-bold uppercase text-center leading-[1] px-1">QR CODE</span>
                      </div>
                      <div className="text-[10px] text-slate-400 font-medium leading-tight">
                        Digitally signed document.<br />
                        Verify via official Didox portal.
                      </div>
                   </div>
                   <div className="text-[10px] text-slate-300 font-bold uppercase tracking-widest">
                      Finance21 Accounting System
                   </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

