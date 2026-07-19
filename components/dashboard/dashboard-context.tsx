"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from "react";
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
  /** Register a callback to be invoked after a trade is manually closed */
  setOnTradeClosedCallback: (cb: (() => void) | null) => void;
  /** Register a callback to be invoked after a trade is modified */
  setOnTradeModifiedCallback: (cb: (() => void) | null) => void;
  /** Register a callback to be invoked after a trade is created */
  setOnTradeCreatedCallback: (cb: (() => void) | null) => void;
}

const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

export function DashboardProvider({ children }: { children: React.ReactNode }) {
  const [isCreateTradeOpen, setIsCreateTradeOpen] = useState(false);
  const [tradeToClose, setTradeToClose] = useState<Trade | null>(null);
  const [tradeToModify, setTradeToModify] = useState<Trade | null>(null);
  const [toastMessage, setToastMessage] = useState<ToastState | null>(null);
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(false);

  const onTradeClosedCallbackRef = useRef<(() => void) | null>(null);
  const onTradeModifiedCallbackRef = useRef<(() => void) | null>(null);
  const onTradeCreatedCallbackRef = useRef<(() => void) | null>(null);

  const { latestNotification, prices, sendMessage } = useWebSocket();

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

  const setOnTradeClosedCallback = (cb: (() => void) | null) => {
    onTradeClosedCallbackRef.current = cb;
  };

  const setOnTradeModifiedCallback = (cb: (() => void) | null) => {
    onTradeModifiedCallbackRef.current = cb;
  };

  const setOnTradeCreatedCallback = (cb: (() => void) | null) => {
    onTradeCreatedCallbackRef.current = cb;
  };

  const handleCloseSuccess = (title: string, message: string) => {
    showSuccessToast(title, message);
    onTradeClosedCallbackRef.current?.();
  };

  const handleModifySuccess = (title: string, message: string) => {
    showSuccessToast(title, message);
    onTradeModifiedCallbackRef.current?.();
  };

  const handleCreateSuccess = (title: string, message: string) => {
    showSuccessToast(title, message);
    onTradeCreatedCallbackRef.current?.();
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
        setOnTradeClosedCallback,
        setOnTradeModifiedCallback,
        setOnTradeCreatedCallback,
      }}
    >
      {children}

      {/* Global Overlay Modal */}
      {isCreateTradeOpen && (
        <CreateTradeModal
          livePrices={prices}
          sendMessage={sendMessage}
          onClose={closeCreateTrade}
          onSuccess={handleCreateSuccess}
        />
      )}

      {tradeToClose && (
        <CloseTradeModal
          trade={tradeToClose}
          onClose={closeCloseTrade}
          onSuccess={handleCloseSuccess}
        />
      )}

      {tradeToModify && (
        <ModifyTradeModal
          trade={tradeToModify}
          livePrices={prices}
          onClose={closeModifyTrade}
          onSuccess={handleModifySuccess}
        />
      )}

      {/* Global Success Toast */}
      {toastMessage && (
        <SuccessToast
          message={toastMessage.message}
          onClose={closeToast}
          title={toastMessage.title}
        />
      )}
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
