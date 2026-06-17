"use client";

import { useState, useEffect, useRef, useCallback } from "react";

/**
 * WebSocket hook for receiving live price updates from the Stoxify backend.
 *
 * Usage:
 * ```tsx
 * const { prices, isConnected, error } = useWebSocket();
 * // prices = { "RELIANCE": 2850.50, "SBIN": 580.25, … }
 * ```
 */

interface PriceMap {
  [symbol: string]: number;
}

interface UseWebSocketReturn {
  /** Current live prices — symbol → LTP */
  prices: PriceMap;
  /** Whether the WebSocket is connected */
  isConnected: boolean;
  /** Last connection error, if any */
  error: string | null;
}

const MAX_RECONNECT_ATTEMPTS = 5;
const RECONNECT_INTERVAL_MS = 3000;

export function useWebSocket(): UseWebSocketReturn {
  const [prices, setPrices] = useState<PriceMap>({});
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMountedRef = useRef(true);

  const connect = useCallback(async function connectImpl() {
    // Skip if already connected
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    try {
      // Step 1: Obtain a one-time channel_id from the auth service
      const channelRes = await fetch("/api/auth/request-ws-channel", {
        method: "POST",
        credentials: "same-origin",
        cache: "no-store",
      });

      if (!channelRes.ok) {
        throw new Error(`Failed to get WS channel: ${channelRes.status}`);
      }

      const { channel_id } = await channelRes.json();
      if (!channel_id) {
        throw new Error("No channel_id returned");
      }

      // Step 2: Determine the WebSocket URL
      const wsBaseUrl =
        process.env.NEXT_PUBLIC_WS_URL || "wss://stoxify-backend-monolith.onrender.com";
      const wsUrl = `${wsBaseUrl}/?channel_id=${channel_id}`;

      // Step 3: Open WebSocket connection
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        if (!isMountedRef.current) return;
        setIsConnected(true);
        setError(null);
        reconnectAttemptsRef.current = 0;
        console.log("[WS] Connected");
      };

      ws.onmessage = (event) => {
        if (!isMountedRef.current) return;
        try {
          const msg = JSON.parse(event.data);

          if (msg.type === "price_update" && msg.prices) {
            setPrices((prev) => ({
              ...prev,
              ...msg.prices,
            }));
          }

          // Keep-alive pong is handled server-side; we send pings
        } catch {
          // Ignore malformed messages
        }
      };

      ws.onclose = (event) => {
        if (!isMountedRef.current) return;
        setIsConnected(false);
        console.log("[WS] Disconnected", event.code, event.reason);

        // Auto-reconnect unless deliberately closed or max attempts reached
        if (
          event.code !== 4001 &&
          event.code !== 4002 &&
          reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS
        ) {
          reconnectAttemptsRef.current += 1;
          reconnectTimerRef.current = setTimeout(() => connectImpl(), RECONNECT_INTERVAL_MS);
        }
      };

      ws.onerror = () => {
        if (!isMountedRef.current) return;
        setError("WebSocket connection error");
      };
    } catch (err: unknown) {
      if (!isMountedRef.current) return;
      const message = err instanceof Error ? err.message : "Connection failed";
      setError(message);
      console.error("[WS] Connection error:", message);

      // Retry
      if (reconnectAttemptsRef.current < MAX_RECONNECT_ATTEMPTS) {
        reconnectAttemptsRef.current += 1;
        reconnectTimerRef.current = setTimeout(() => connectImpl(), RECONNECT_INTERVAL_MS);
      }
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;
    connect();

    // Keep-alive ping every 25 seconds
    const pingInterval = setInterval(() => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(JSON.stringify({ type: "ping" }));
      }
    }, 25_000);

    return () => {
      isMountedRef.current = false;
      clearInterval(pingInterval);
      if (reconnectTimerRef.current) clearTimeout(reconnectTimerRef.current);
      if (wsRef.current) {
        wsRef.current.close(1000, "Component unmounted");
        wsRef.current = null;
      }
    };
  }, [connect]);

  return { prices, isConnected, error };
}
