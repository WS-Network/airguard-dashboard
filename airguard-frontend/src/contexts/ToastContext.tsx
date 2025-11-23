"use client";

import React, { createContext, useContext, useState, ReactNode } from "react";
import ToastContainer from "@/components/common/ToastContainer";
import { ToastProps, ToastType } from "@/components/common/Toast";

interface ToastContextType {
  showToast: (options: Omit<ToastProps, "id" | "onClose">) => void;
  showSuccess: (title: string, message?: string) => void;
  showError: (title: string, message?: string) => void;
  showWarning: (title: string, message?: string) => void;
  showInfo: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

interface ToastProviderProps {
  children: ReactNode;
}

export function ToastProvider({ children }: ToastProviderProps) {
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  const showToast = (options: Omit<ToastProps, "id" | "onClose">) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const newToast: ToastProps = {
      ...options,
      id,
      onClose: removeToast,
    };

    setToasts((prev) => [...prev, newToast]);

    // Auto-remove toast after duration
    setTimeout(() => {
      removeToast(id);
    }, options.duration || 5000);
  };

  const showSuccess = (title: string, message?: string) => {
    showToast({
      type: "success",
      title,
      message,
      duration: 4000,
    });
  };

  const showError = (title: string, message?: string) => {
    showToast({
      type: "error",
      title,
      message,
      duration: 6000, // Longer duration for errors
    });
  };

  const showWarning = (title: string, message?: string) => {
    showToast({
      type: "warning",
      title,
      message,
      duration: 5000,
    });
  };

  const showInfo = (title: string, message?: string) => {
    showToast({
      type: "info",
      title,
      message,
      duration: 4000,
    });
  };

  const value: ToastContextType = {
    showToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
  };

  return (
    <ToastContext.Provider value={value}>
      {children}
      <ToastContainer toasts={toasts} onClose={removeToast} />
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextType {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}