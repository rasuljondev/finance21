"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useRouter } from "next/navigation";
import apiClient from "@/lib/api-client";

type Company = { id: string; tin: string; name: string };
type Person = { id: string; fullName: string; pinfl?: string | null };

export type ERILoginPayload = {
  inn: string;
  pkcs7_64: string;
  signature_hex: string;
  companyName: string;
  fullName: string;
  pinfl?: string;
};

interface AuthContextType {
  user: { taxId: string; fullName?: string } | null;
  company: Company | null;
  person: Person | null;
  isLoading: boolean;
  login: (login: string, password: string) => Promise<void>;
  loginWithERI: (payload: ERILoginPayload) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<{ taxId: string; fullName?: string } | null>(null);
  const [company, setCompany] = useState<Company | null>(null);
  const [person, setPerson] = useState<Person | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Rehydrate from backend session cookie
    const load = async () => {
      try {
        const res = await apiClient.get("/auth/me");
        const data = res.data;
        if (data?.company && data?.session?.companyTin) {
          setCompany(data.company);
          setPerson(data.person || null);
          setUser({ taxId: data.session.companyTin, fullName: data.person?.fullName });
        } else {
          setCompany(null);
          setPerson(null);
          setUser(null);
        }
      } catch {
        setCompany(null);
        setPerson(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const login = async (_login: string, _password: string) => {
    // Placeholder for later (per your decision: first time is ERI-only)
    throw new Error("Login/Password will be implemented later. Please use E-IMZO.");
  };

  const loginWithERI = async (payload: ERILoginPayload) => {
    // Backend will: timestamp -> exchange token -> upsert company/person/role -> set httpOnly session cookie
    await apiClient.post("/auth/eri/login", payload);
    // Rehydrate state
    const res = await apiClient.get("/auth/me");
    const data = res.data;
    setCompany(data.company || null);
    setPerson(data.person || null);
    setUser(data?.session?.companyTin ? { taxId: data.session.companyTin, fullName: data.person?.fullName } : null);
    router.push("/app/dashboard");
  };

  const logout = async () => {
    setUser(null);
    setCompany(null);
    setPerson(null);
    try {
      await apiClient.post("/auth/logout");
    } catch {
      // ignore
    }
    router.push("/login");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        company,
        person,
        isLoading,
        login,
        loginWithERI,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

