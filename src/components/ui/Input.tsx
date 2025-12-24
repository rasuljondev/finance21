"use client";

import React, { InputHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

export type InputVariant = "default" | "error" | "success";
export type InputSize = "sm" | "md" | "lg";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  variant?: InputVariant;
  inputSize?: InputSize;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  helperText?: string;
  label?: string;
}

const variantStyles = {
  default:
    "border-gray-200 focus:border-blue-500 focus:ring-blue-500/20 dark:border-white/10 dark:focus:border-blue-500 dark:focus:ring-blue-500/20",
  error:
    "border-red-300 focus:border-red-500 focus:ring-red-500/20 dark:border-red-700/50 dark:focus:border-red-500 dark:focus:ring-red-500/20",
  success:
    "border-green-300 focus:border-green-500 focus:ring-green-500/20 dark:border-green-700/50 dark:focus:border-green-500 dark:focus:ring-green-500/20",
};

const sizeStyles = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2.5 text-base",
  lg: "px-4 py-3.5 text-lg",
};

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      variant = "default",
      inputSize = "md",
      leftIcon,
      rightIcon,
      helperText,
      label,
      className = "",
      id,
      ...props
    },
    ref
  ) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");

    const baseStyles =
      "w-full rounded-xl border bg-white dark:bg-white/[0.03] text-gray-900 dark:text-gray-100 shadow-sm transition placeholder:text-gray-400 dark:placeholder:text-gray-500 focus:ring-2 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed font-medium";

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-bold text-slate-700 dark:text-slate-300 mb-1.5 ml-1"
          >
            {label}
          </label>
        )}
        <div className="relative group">
          {leftIcon && (
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors">
              {leftIcon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            className={cn(
              baseStyles,
              variantStyles[variant],
              sizeStyles[inputSize],
              leftIcon && "pl-11",
              rightIcon && "pr-11",
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors">
              {rightIcon}
            </div>
          )}
        </div>
        {helperText && (
          <p
            className={cn(
              "mt-1.5 text-xs font-medium ml-1",
              variant === "error"
                ? "text-red-600 dark:text-red-400"
                : variant === "success"
                ? "text-green-600 dark:text-green-400"
                : "text-gray-500 dark:text-gray-400"
            )}
          >
            {helperText}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

