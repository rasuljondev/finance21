"use client";

import { SuperadminLayoutProvider } from "@/components/layout/SuperadminLayoutProvider";

export default function SuperadminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <SuperadminLayoutProvider>
      {children}
    </SuperadminLayoutProvider>
  );
}

