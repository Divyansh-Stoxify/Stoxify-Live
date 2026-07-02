"use client";

import React, { createContext, useContext, useState, useEffect } from "react";
import { CreateTradeModal } from "@/components/dashboard/create-trade-modal";
import { CloseTradeModal } from "@/components/dashboard/close-trade-modal";
import { ModifyTradeModal } from "@/components/dashboard/modify-trade-modal";
import { SuccessToast } from "@/components/dashboard/success-toast";
import type { Trade } from "@/lib/types/analyst";
import { toast } from "sonner";
import { useWebSocket } from "@/hooks/use-websocket";

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
  hasUnreadNotifications: boolean;
  setHasUnreadNotifications: (value: boolean) => void;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const [isCreateTradeOpen, setIsCreateTradeOpen] = useState(false);
  const [tradeToClose, setTradeToClose] = useState<Trade | null>(null);
  const [tradeToModify, setTradeToModify] = useState<Trade | null>(null);
  const [toastMessage, setToastMessage] = useState<ToastState | null>(null);
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);

  const { latestNotification } = useWebSocket();

  // Initial fetch to check for unread notifications
  useEffect(() => {
    fetch("/api/analyst/notifications?read=false&limit=1", {
      credentials: "same-origin",
      cache: "no-store",
    })
      .then((res) => res.json())
      .then((data) => {
        const notifs = data.notifications ?? data.data ?? [];
        if (notifs.length > 0) setHasUnreadNotifications(true);
        else setHasUnreadNotifications(false);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (latestNotification) {
      toast.success(latestNotification.title, {
        description: latestNotification.message,
        duration: 5000,
      });
      setHasUnreadNotifications(true);
    }
  }, [latestNotification]);

  const openCreateTrade = () => setIsCreateTradeOpen(true);
  const closeCreateTrade = () => setIsCreateTradeOpen(false);

  const openCloseTrade = (trade: Trade) => setTradeToClose(trade);
  const closeCloseTrade = () => setTradeToClose(null);

  const openModifyTrade = (trade: Trade) => setTradeToModify(trade);
  const closeModifyTrade = () => setTradeToModify(null);

  const showSuccessToast = (title: string, message: string) => {
    setToastMessage({ title, message });
  };

  const closeToast = () => {
    setToastMessage(null);
  };

  // Auto-dismiss toast after 5 seconds
  useEffect(() => {
    if (toastMessage) {
      const timer = setTimeout(() => {
        setToastMessage(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [toastMessage]);

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
        hasUnreadNotifications,
        setHasUnreadNotifications,
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
      {toastMessage && <SuccessToast message={toastMessage.message} onClose={closeToast} title={toastMessage.title} />}
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
