"use client";

import React from 'react';
import { CheckCircle2, AlertCircle, AlertTriangle, Info, X } from 'lucide-react';
import { cn } from "@/lib/utils";

export type AlertType = 'success' | 'error' | 'warning' | 'info';

export interface AlertProps {
  type: AlertType;
  message: string;
  duration?: number;
  onClose: () => void;
  icon?: React.ReactNode;
}

const alertStyles: Record<AlertType, {
  bg: string;
  border: string;
  text: string;
  iconColor: string;
  progress: string;
  icon: React.ReactNode;
}> = {
  success: {
    bg: 'bg-white dark:bg-[#111322]',
    border: 'border-emerald-100 dark:border-emerald-500/20',
    text: 'text-slate-600 dark:text-slate-300',
    iconColor: 'text-emerald-500',
    progress: 'bg-emerald-500',
    icon: <CheckCircle2 className="w-5 h-5" />,
  },
  error: {
    bg: 'bg-white dark:bg-[#111322]',
    border: 'border-red-100 dark:border-red-500/20',
    text: 'text-slate-600 dark:text-slate-300',
    iconColor: 'text-red-500',
    progress: 'bg-red-500',
    icon: <AlertCircle className="w-5 h-5" />,
  },
  warning: {
    bg: 'bg-white dark:bg-[#111322]',
    border: 'border-amber-100 dark:border-amber-500/20',
    text: 'text-slate-600 dark:text-slate-300',
    iconColor: 'text-amber-500',
    progress: 'bg-amber-500',
    icon: <AlertTriangle className="w-5 h-5" />,
  },
  info: {
    bg: 'bg-white dark:bg-[#111322]',
    border: 'border-blue-100 dark:border-blue-500/20',
    text: 'text-slate-600 dark:text-slate-300',
    iconColor: 'text-blue-500',
    progress: 'bg-blue-500',
    icon: <Info className="w-5 h-5" />,
  },
};

export const Alert = ({ type, message, duration = 3000, onClose, icon }: AlertProps) => {
  const [progress, setProgress] = React.useState(100);

  React.useEffect(() => {
    const startTime = Date.now();
    const interval = 10;
    
    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
      
      setProgress(remaining);
      
      if (remaining <= 0) {
        clearInterval(timer);
        onClose();
      }
    }, interval);

    return () => clearInterval(timer);
  }, [duration, onClose]);

  const style = alertStyles[type];
  const displayIcon = icon || style.icon;

  return (
    <div
      className={cn(
        "min-w-[320px] max-w-md rounded-2xl border shadow-xl overflow-hidden pointer-events-auto",
        style.bg,
        style.border
      )}
    >
      <div className="p-4">
        <div className="flex items-start gap-3">
          <div className={cn("flex-shrink-0 mt-0.5", style.iconColor)}>
            {displayIcon}
          </div>
          <div className="flex-1 min-w-0">
            <p className={cn("text-sm font-bold capitalize mb-0.5", style.iconColor)}>
              {type}
            </p>
            <p className={cn("text-sm font-medium leading-relaxed", style.text)}>
              {message}
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 rounded-xl p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-white/5 transition-all"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
      {/* Progress indicator */}
      <div className="h-1 w-full bg-slate-100 dark:bg-white/5">
        <div
          className={cn("h-full transition-all duration-100 ease-linear", style.progress)}
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
};

