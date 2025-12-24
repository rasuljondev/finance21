"use client";

import LoginCard from "@/components/LoginCard";
import { BackgroundBeamsWithCollision } from "@/components/ui/BackgroundBeamsWithCollision";

export default function LoginPage() {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-indigo-900/20 dark:to-purple-900/20 transition-colors duration-300">
      <BackgroundBeamsWithCollision className="flex-1 flex items-center justify-center relative overflow-hidden min-h-screen p-4">
        <LoginCard />
      </BackgroundBeamsWithCollision>
    </div>
  );
}
