"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/contexts/AuthContext";
import { useAlert } from "@/components/ui/AlertProvider";
import ERILoginModal from "./ERILoginModal";
import { Lock, User } from "lucide-react";

export default function LoginCard() {
  const { login: authLogin } = useAuth();
  const { showSuccess, showError } = useAlert();
  const [taxId, setTaxId] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showEimzoModal, setShowEimzoModal] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await authLogin(taxId, password);
      showSuccess("Successfully logged in!");
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Tax ID or password is incorrect";
      showError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md animate-in fade-in slide-in-from-bottom-8 duration-700">
      <div className="mb-8 flex flex-col items-center">
        <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg mb-4 flex items-center justify-center">
           <div className="h-8 w-8 text-white">
              <Lock className="w-full h-full" />
           </div>
        </div>
        <div className="text-3xl font-bold text-gray-900 dark:text-white">Finance21</div>
        <p className="text-gray-500 dark:text-gray-400 mt-2 font-medium">Login to Management System</p>
      </div>

      <div className="bg-white/90 dark:bg-gray-800/80 backdrop-blur-xl shadow-2xl rounded-3xl p-8 border border-gray-200/50 dark:border-gray-700/30">
        <h1 className="text-2xl font-bold text-center text-gray-900 dark:text-white mb-8">
          Login
        </h1>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <Input
              name="taxId"
              type="text"
              placeholder="Login (coming soon)"
              autoComplete="username"
              value={taxId}
              onChange={(e) => setTaxId(e.target.value)}
              required
              leftIcon={<User className="h-5 w-5" />}
            />
            <Input
              name="password"
              type="password"
              placeholder="Password (coming soon)"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              leftIcon={<Lock className="h-5 w-5" />}
            />
            <Button
              type="submit"
              fullWidth
              size="lg"
              isLoading={loading}
            >
              Login
            </Button>
          </div>

          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white/90 dark:bg-gray-800/80 text-gray-500 dark:text-gray-400 rounded-full font-medium">or</span>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowEimzoModal(true)}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 border-2 border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-500 rounded-xl font-bold hover:bg-blue-50 dark:hover:bg-blue-900/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 active:scale-[0.98]"
          >
            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 1a4.5 4.5 0 00-4.5 4.5V9H5a2 2 0 00-2 2v6a2 2 0 002 2h10a2 2 0 002-2v-6a2 2 0 00-2-2h-.5V5.5A4.5 4.5 0 0010 1zm3 8V5.5a3 3 0 10-6 0V9h6z" clipRule="evenodd" />
            </svg>
            Login with E-IMZO
          </button>
        </form>
      </div>

      {showEimzoModal && (
        <ERILoginModal
          onSuccess={() => {
            setShowEimzoModal(false);
            showSuccess("Successfully logged in with E-IMZO!");
            // Success is handled by AuthContext (redirects to dashboard)
          }}
          onCancel={() => setShowEimzoModal(false)}
        />
      )}
    </div>
  );
}
