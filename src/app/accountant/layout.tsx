"use client";

import { AccountantLayoutProvider } from "@/components/layout/AccountantLayoutProvider";

export default function AccountantLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AccountantLayoutProvider>
      {children}
    </AccountantLayoutProvider>
  );
}

