"use client";

import React, { useState } from "react";
import { useAlert } from "@/components/ui/AlertProvider";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { CashBalanceWidget } from "@/components/dashboard/CashBalanceWidget";
import { RelationshipWidget } from "@/components/dashboard/RelationshipWidget";
import { TaskCalendarWidget } from "@/components/dashboard/TaskCalendarWidget";
import { DebtorCreditorWidget } from "@/components/dashboard/DebtorCreditorWidget";

export default function DashboardPage() {
  const { showSuccess } = useAlert();
  const [loading, setLoading] = useState(false);

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      showSuccess("Data refreshed");
    }, 1000);
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-700 pb-8">
      {/* Header */}
      <DashboardHeader onRefresh={handleRefresh} loading={loading} />

      {/* Cash Balances Section */}
      <CashBalanceWidget />

      {/* Bottom Section - Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <RelationshipWidget />
        <TaskCalendarWidget />
        <DebtorCreditorWidget />
      </div>
    </div>
  );
}
