"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Alert, type AlertType } from "./Alert";

interface AlertItem {
  id: string;
  type: AlertType;
  message: string;
  duration?: number;
}

interface AlertContextType {
  toast: (message: string, type?: AlertType, duration?: number) => void;
  showSuccess: (message: string, duration?: number) => void;
  showError: (message: string, duration?: number) => void;
  showWarning: (message: string, duration?: number) => void;
  showInfo: (message: string, duration?: number) => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export const useAlert = () => {
  const context = useContext(AlertContext);
  if (!context) throw new Error("useAlert must be used within AlertProvider");
  return context;
};

export const AlertProvider = ({ children }: { children: ReactNode }) => {
  const [alerts, setAlerts] = useState<AlertItem[]>([]);

  const removeAlert = useCallback((id: string) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  }, []);

  const toast = useCallback((message: string, type: AlertType = "info", duration: number = 2000) => {
    const id = Math.random().toString(36).substring(2, 9);
    setAlerts((prev) => [...prev, { id, type, message, duration }]);
  }, []);

  const showSuccess = useCallback((m: string, d?: number) => toast(m, "success", d), [toast]);
  const showError = useCallback((m: string, d?: number) => toast(m, "error", d), [toast]);
  const showWarning = useCallback((m: string, d?: number) => toast(m, "warning", d), [toast]);
  const showInfo = useCallback((m: string, d?: number) => toast(m, "info", d), [toast]);

  return (
    <AlertContext.Provider value={{ toast, showSuccess, showError, showWarning, showInfo }}>
      {children}
      <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-3 pointer-events-none">
        <AnimatePresence mode="popLayout">
          {alerts.map((alert) => (
            <motion.div
              key={alert.id}
              initial={{ opacity: 0, x: 50, scale: 0.9 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.95 }}
              layout
              className="pointer-events-auto"
            >
              <Alert
                type={alert.type}
                message={alert.message}
                duration={alert.duration}
                onClose={() => removeAlert(alert.id)}
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </AlertContext.Provider>
  );
};
