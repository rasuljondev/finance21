"use client";

import { AppLayoutProvider } from "@/components/layout/AppLayoutProvider";

export default function MainpageLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AppLayoutProvider>
      {children}
    </AppLayoutProvider>
  );
}
