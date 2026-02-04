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
  version: number; // Add version for conflict resolution
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

const STORAGE_KEY = "ptsp-queue-state-v3";

const getInitialState = (): QueueState => ({
  lokets: initialLokets,
  sharedQueueCounter: 0,
  kasirCounter: 0,
  lastUpdate: 0,
  version: 0,
});

// Read state from localStorage
function readFromStorage(): QueueState {
  if (typeof window === "undefined") return getInitialState();
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved) as QueueState;
      // Ensure all required fields exist
      return {
        ...getInitialState(),
        ...parsed,
      };
    }
  } catch (e) {
    console.error("Error reading from localStorage:", e);
  }
  return getInitialState();
}

// Write state to localStorage
function writeToStorage(state: QueueState): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error("Error writing to localStorage:", e);
  }
}

// Context
const QueueContext = createContext<QueueContextType | undefined>(undefined);

// Provider
export function QueueProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<QueueState>(getInitialState);
  const [isLoading, setIsLoading] = useState(true);
  const stateRef = useRef<QueueState>(state);
  const isUpdatingRef = useRef(false);

  // Keep ref in sync with state
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = readFromStorage();
    setState(stored);
    stateRef.current = stored;
    setIsLoading(false);
  }, []);

  // Listen for storage events from other tabs
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY && e.newValue && !isUpdatingRef.current) {
        try {
          const newState = JSON.parse(e.newValue) as QueueState;
          // Only update if the incoming state is newer
          if (newState.version > stateRef.current.version) {
            setState(newState);
            stateRef.current = newState;
          }
        } catch (e) {
          console.error("Error parsing storage event:", e);
        }
      }
    };

    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  // Periodic sync for same-tab updates (BroadcastChannel alternative)
  useEffect(() => {
    if (isLoading) return;

    const syncInterval = setInterval(() => {
      if (isUpdatingRef.current) return;

      const stored = readFromStorage();
      // Only update if storage has newer version
      if (stored.version > stateRef.current.version) {
        setState(stored);
        stateRef.current = stored;
      }
    }, 300);

    return () => clearInterval(syncInterval);
  }, [isLoading]);

  // Atomic update function
  const updateState = useCallback((updater: (prev: QueueState) => QueueState) => {
    isUpdatingRef.current = true;

    // Read latest from storage to prevent overwrites
    const current = readFromStorage();
    const newState = updater({
      ...current,
      version: current.version, // Preserve current version for comparison
    });

    // Increment version
    newState.version = current.version + 1;
    newState.lastUpdate = Date.now();

    // Write to storage first
    writeToStorage(newState);

    // Then update React state
    setState(newState);
    stateRef.current = newState;

    // Reset updating flag after a short delay
    setTimeout(() => {
      isUpdatingRef.current = false;
    }, 100);
  }, []);

  const callNext = useCallback((loketId: string) => {
    updateState((prev) => {
      const loket = prev.lokets.find(l => l.id === loketId);
      if (!loket) return prev;

      let newSharedCounter = prev.sharedQueueCounter;
      let newKasirCounter = prev.kasirCounter;
      let newNumber: number;

      if (loket.sharedQueue) {
        newSharedCounter = prev.sharedQueueCounter + 1;
        newNumber = newSharedCounter;
      } else {
        newKasirCounter = prev.kasirCounter + 1;
        newNumber = newKasirCounter;
      }

      const newLokets = prev.lokets.map(l => {
        if (l.id === loketId) {
          return {
            ...l,
            currentNumber: newNumber,
            lastCalled: Date.now(),
          };
        }
        return l;
      });

      return {
        ...prev,
        lokets: newLokets,
        sharedQueueCounter: newSharedCounter,
        kasirCounter: newKasirCounter,
      };
    });
  }, [updateState]);

  const recallCurrent = useCallback((loketId: string) => {
    updateState((prev) => {
      const newLokets = prev.lokets.map(l => {
        if (l.id === loketId) {
          return {
            ...l,
            lastCalled: Date.now(),
          };
        }
        return l;
      });

      return {
        ...prev,
        lokets: newLokets,
      };
    });
  }, [updateState]);

  const resetQueue = useCallback((loketId: string) => {
    updateState((prev) => {
      const loket = prev.lokets.find(l => l.id === loketId);
      if (!loket) return prev;

      if (loket.sharedQueue) {
        // Reset all shared queue lokets
        const newLokets = prev.lokets.map(l => {
          if (l.sharedQueue) {
            return { ...l, currentNumber: 0, lastCalled: null };
          }
          return l;
        });
        return {
          ...prev,
          lokets: newLokets,
          sharedQueueCounter: 0,
        };
      } else {
        // Reset only this loket
        const newLokets = prev.lokets.map(l => {
          if (l.id === loketId) {
            return { ...l, currentNumber: 0, lastCalled: null };
          }
          return l;
        });
        return {
          ...prev,
          lokets: newLokets,
          kasirCounter: 0,
        };
      }
    });
  }, [updateState]);

  const resetAll = useCallback(() => {
    updateState(() => ({
      ...getInitialState(),
      version: stateRef.current.version + 1,
      lastUpdate: Date.now(),
    }));
  }, [updateState]);

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
