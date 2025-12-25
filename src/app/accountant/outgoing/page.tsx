"use client";

import React from "react";
import { InvoiceList } from "@/components/trade/InvoiceList";

export default function AccountantOutgoingPage() {
  return <InvoiceList title="Outgoing Invoices" type="outgoing" />;
}

