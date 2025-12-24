export type InvoiceStatus = 'waiting' | 'signed' | 'rejected' | 'deleted' | 'all' | 'proxy';

export interface DidoxData {
  doctype?: string | number;
  owner?: number;
  doc_status?: number;
  status?: string | number;
  status_comment?: string;
  partnerCompany?: string;
  partnerTin?: string;
  contract_number?: string;
  contract_date?: string;
  doc_date?: string;
  name?: string;
  sellerName?: string;
  buyerName?: string;
  sellerAddress?: string;
  buyerAddress?: string;
}

export interface Invoice {
  id: string;
  type: string;
  date: string | null;
  number: string | null;
  amount: number;
  status: string;
  counterpartyName: string | null;
  counterpartyStir: string | null;
  contractDate: string | null;
  contractNumber: string | null;
  updatedAt?: string;
  vatAmount?: number;
  deliveryValue?: number;
  didoxData?: DidoxData;
}

