"use client";

import React from "react";
import { Database } from "lucide-react";

export default function DataPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
      <div className="p-4 bg-blue-500/10 rounded-full">
        <Database className="w-12 h-12 text-blue-500" />
      </div>
      <h1 className="text-2xl font-semibold text-white">Data Management</h1>
      <p className="text-slate-400">This module is currently under development. Coming soon!</p>
    </div>
  );
}

