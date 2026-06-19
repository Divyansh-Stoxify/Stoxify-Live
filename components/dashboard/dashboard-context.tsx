"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { CreateTradeModal } from "@/components/dashboard/create-trade-modal";
import { CloseTradeModal } from "@/components/dashboard/close-trade-modal";
import { ModifyTradeModal } from "@/components/dashboard/modify-trade-modal";
import { SuccessToast } from "@/components/dashboard/success-toast";
import type { Trade } from "@/lib/types/analyst";

interface ToastState {
  title: string;
  message: string;
}

interface DashboardContextType {
  isCreateTradeOpen: boolean;
  openCreateTrade: () => void;
  closeCreateTrade: () => void;
  tradeToClose: Trade | null;
  openCloseTrade: (trade: Trade) => void;
  closeCloseTrade: () => void;
  tradeToModify: Trade | null;
  openModifyTrade: (trade: Trade) => void;
  closeModifyTrade: () => void;
  showSuccessToast: (title: string, message: string) => void;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const [isCreateTradeOpen, setIsCreateTradeOpen] = useState(false);
  const [tradeToClose, setTradeToClose] = useState<Trade | null>(null);
  const [tradeToModify, setTradeToModify] = useState<Trade | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);

  const openCreateTrade = () => setIsCreateTradeOpen(true);
  const closeCreateTrade = () => setIsCreateTradeOpen(false);

  const openCloseTrade = (trade: Trade) => setTradeToClose(trade);
  const closeCloseTrade = () => setTradeToClose(null);

  const openModifyTrade = (trade: Trade) => setTradeToModify(trade);
  const closeModifyTrade = () => setTradeToModify(null);

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
        tradeToClose,
        openCloseTrade,
        closeCloseTrade,
        tradeToModify,
        openModifyTrade,
        closeModifyTrade,
        showSuccessToast,
      }}
    >
      {children}

      {/* Global Overlay Modal */}
      {isCreateTradeOpen && (
        <CreateTradeModal onClose={closeCreateTrade} onSuccess={showSuccessToast} />
      )}

      {tradeToClose && (
        <CloseTradeModal
          trade={tradeToClose}
          onClose={closeCloseTrade}
          onSuccess={showSuccessToast}
        />
      )}

      {tradeToModify && (
        <ModifyTradeModal
          trade={tradeToModify}
          onClose={closeModifyTrade}
          onSuccess={showSuccessToast}
        />
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
