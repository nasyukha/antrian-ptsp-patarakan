"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode, useRef } from "react";

// Types
interface LoketData {
  id: string;
  name: string;
  prefix: string;
  currentNumber: number;
  lastCalled: number | null;
  isActive: boolean;
  sharedQueue: boolean;
}

interface QueueState {
  lokets: LoketData[];
  sharedQueueCounter: number;
  kasirCounter: number;
  lastUpdate: number;
  version: number;
}

interface QueueContextType {
  lokets: LoketData[];
  callNext: (loketId: string) => void;
  recallCurrent: (loketId: string) => void;
  resetQueue: (loketId: string) => void;
  resetAll: () => void;
  getLoket: (loketId: string) => LoketData | undefined;
  isLoading: boolean;
  sharedQueueCounter: number;
  kasirCounter: number;
}

// Initial loket configuration
const initialLokets: LoketData[] = [
  { id: "loket-1", name: "LOKET 1", prefix: "A", currentNumber: 0, lastCalled: null, isActive: true, sharedQueue: true },
  { id: "loket-2", name: "LOKET 2", prefix: "A", currentNumber: 0, lastCalled: null, isActive: true, sharedQueue: true },
  { id: "loket-3", name: "LOKET 3", prefix: "A", currentNumber: 0, lastCalled: null, isActive: true, sharedQueue: true },
  { id: "kasir", name: "KASIR", prefix: "K", currentNumber: 0, lastCalled: null, isActive: true, sharedQueue: false },
];

const getInitialState = (): QueueState => ({
  lokets: initialLokets,
  sharedQueueCounter: 0,
  kasirCounter: 0,
  lastUpdate: 0,
  version: 0,
});

// Context
const QueueContext = createContext<QueueContextType | undefined>(undefined);

// Provider
export function QueueProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<QueueState>(getInitialState);
  const [isLoading, setIsLoading] = useState(true);
  const versionRef = useRef(0);
  const isUpdatingRef = useRef(false);

  // Fetch state from API
  const fetchState = useCallback(async () => {
    if (isUpdatingRef.current) return;

    try {
      const response = await fetch("/api/queue");
      if (response.ok) {
        const data: QueueState = await response.json();
        // Only update if version is newer
        if (data.version > versionRef.current) {
          versionRef.current = data.version;
          setState(data);
        }
      }
    } catch (error) {
      console.error("Error fetching queue state:", error);
    }
  }, []);

  // Initial fetch
  useEffect(() => {
    fetchState().finally(() => setIsLoading(false));
  }, [fetchState]);

  // Poll for updates every 500ms
  useEffect(() => {
    const interval = setInterval(fetchState, 500);
    return () => clearInterval(interval);
  }, [fetchState]);

  // Send action to API
  const sendAction = useCallback(async (action: string, loketId?: string) => {
    isUpdatingRef.current = true;

    try {
      const response = await fetch("/api/queue", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, loketId }),
      });

      if (response.ok) {
        const data: QueueState = await response.json();
        versionRef.current = data.version;
        setState(data);
      }
    } catch (error) {
      console.error("Error sending action:", error);
    } finally {
      isUpdatingRef.current = false;
    }
  }, []);

  const callNext = useCallback((loketId: string) => {
    sendAction("callNext", loketId);
  }, [sendAction]);

  const recallCurrent = useCallback((loketId: string) => {
    sendAction("recallCurrent", loketId);
  }, [sendAction]);

  const resetQueue = useCallback((loketId: string) => {
    sendAction("resetQueue", loketId);
  }, [sendAction]);

  const resetAll = useCallback(() => {
    sendAction("resetAll");
  }, [sendAction]);

  const getLoket = useCallback((loketId: string) => {
    return state.lokets.find(l => l.id === loketId);
  }, [state.lokets]);

  return (
    <QueueContext.Provider value={{
      lokets: state.lokets,
      callNext,
      recallCurrent,
      resetQueue,
      resetAll,
      getLoket,
      isLoading,
      sharedQueueCounter: state.sharedQueueCounter,
      kasirCounter: state.kasirCounter,
    }}>
      {children}
    </QueueContext.Provider>
  );
}

// Hook
export function useQueue() {
  const context = useContext(QueueContext);
  if (!context) {
    throw new Error("useQueue must be used within a QueueProvider");
  }
  return context;
}
