"use client";

import React from "react";
import { Settings } from "lucide-react";

export default function SettingsPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
      <div className="p-4 bg-purple-500/10 rounded-full">
        <Settings className="w-12 h-12 text-purple-500" />
      </div>
      <h1 className="text-2xl font-semibold text-white">Settings</h1>
      <p className="text-slate-400">Settings and configuration will be available here soon.</p>
    </div>
  );
}

