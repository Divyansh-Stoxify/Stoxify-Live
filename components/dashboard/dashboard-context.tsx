"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { CreateTradeModal } from "@/components/dashboard/create-trade-modal";
import { SuccessToast } from "@/components/dashboard/success-toast";

interface ToastState {
  title: string;
  message: string;
}

interface DashboardContextType {
  isCreateTradeOpen: boolean;
  openCreateTrade: () => void;
  closeCreateTrade: () => void;
  showSuccessToast: (title: string, message: string) => void;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const [isCreateTradeOpen, setIsCreateTradeOpen] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);

  const openCreateTrade = () => setIsCreateTradeOpen(true);
  const closeCreateTrade = () => setIsCreateTradeOpen(false);

  const showSuccessToast = (title: string, message: string) => {
    setToast({ title, message });
  };

  const closeToast = () => {
    setToast(null);
  };

  // Auto-dismiss toast after 5 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  return (
    <DashboardContext.Provider
      value={{
        isCreateTradeOpen,
        openCreateTrade,
        closeCreateTrade,
        showSuccessToast,
      }}
    >
      {children}

      {/* Global Overlay Modal */}
      {isCreateTradeOpen && (
        <CreateTradeModal onClose={closeCreateTrade} onSuccess={showSuccessToast} />
      )}

      {/* Global Success Toast */}
      {toast && <SuccessToast message={toast.message} onClose={closeToast} title={toast.title} />}
    </DashboardContext.Provider>
  );
}

export function useDashboard() {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error("useDashboard must be used within a DashboardProvider");
  }
  return context;
}
