"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useQueue } from "./context/QueueContext";
import { QueueCard } from "./components/QueueCard";
import { useQueueAnnouncement } from "./hooks/useQueueAnnouncement";
import Link from "next/link";

export default function DisplayPage() {
  const { lokets, isLoading } = useQueue();
  const { announceWithChime } = useQueueAnnouncement();
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Track announced calls to prevent duplicates
  const announcedCallsRef = useRef<Set<string>>(new Set());
  // Track if currently announcing to prevent overlaps
  const isAnnouncingRef = useRef(false);
  // Queue for pending announcements
  const announcementQueueRef = useRef<Array<{ name: string; prefix: string; number: number }>>([]);

  // Set mounted flag and initialize time on client
  useEffect(() => {
    setMounted(true);
    setCurrentTime(new Date());
  }, []);

  // Update time every second (only after mounted)
  useEffect(() => {
    if (!mounted) return;
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, [mounted]);

  // Process announcement queue
  const processAnnouncementQueue = useCallback(async () => {
    if (isAnnouncingRef.current || announcementQueueRef.current.length === 0) {
      return;
    }

    isAnnouncingRef.current = true;
    const item = announcementQueueRef.current.shift();

    if (item) {
      await announceWithChime(item.name, item.prefix, item.number);
      // Wait a bit before next announcement
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    isAnnouncingRef.current = false;

    // Process next in queue
    if (announcementQueueRef.current.length > 0) {
      processAnnouncementQueue();
    }
  }, [announceWithChime]);

  // Detect queue changes and announce
  useEffect(() => {
    if (!soundEnabled || !mounted || isLoading) return;

    lokets.forEach(loket => {
      if (loket.lastCalled && loket.currentNumber > 0) {
        // Create unique key for this call
        const callKey = `${loket.id}-${loket.currentNumber}-${loket.lastCalled}`;

        // Only announce if we haven't announced this exact call before
        if (!announcedCallsRef.current.has(callKey)) {
          announcedCallsRef.current.add(callKey);

          // Add to queue instead of playing directly
          announcementQueueRef.current.push({
            name: loket.name,
            prefix: loket.prefix,
            number: loket.currentNumber,
          });

          // Process queue
          processAnnouncementQueue();

          // Clean up old keys (keep only last 100)
          if (announcedCallsRef.current.size > 100) {
            const keys = Array.from(announcedCallsRef.current);
            keys.slice(0, 50).forEach(k => announcedCallsRef.current.delete(k));
          }
        }
      }
    });
  }, [lokets, soundEnabled, mounted, isLoading, processAnnouncementQueue]);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("id-ID", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("id-ID", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });
  };

  const loket1 = lokets.find(l => l.id === "loket-1");
  const loket2 = lokets.find(l => l.id === "loket-2");
  const loket3 = lokets.find(l => l.id === "loket-3");
  const loket4 = lokets.find(l => l.id === "loket-4");

  // Show loading state during SSR and initial hydration
  if (!mounted || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400 text-lg">Memuat...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4 md:p-6 lg:p-8">
      {/* Sound Enable Button - Must be clicked due to browser autoplay policy */}
      {!soundEnabled && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="bg-slate-800 rounded-3xl p-8 max-w-md mx-4 text-center shadow-2xl border border-slate-700">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-blue-600/20 flex items-center justify-center">
              <svg className="w-10 h-10 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">Aktifkan Suara</h2>
            <p className="text-slate-400 mb-6">
              Klik tombol di bawah untuk mengaktifkan pengumuman suara otomatis saat antrian dipanggil.
            </p>
            <button
              onClick={() => setSoundEnabled(true)}
              className="w-full py-4 px-6 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-500 hover:to-blue-600 text-white font-bold rounded-xl transition-all duration-300 transform hover:scale-[1.02]"
            >
              Aktifkan Suara
            </button>
            <button
              onClick={() => setSoundEnabled(true)}
              className="mt-3 text-slate-500 hover:text-slate-300 text-sm transition-colors"
            >
              Lanjutkan tanpa suara
            </button>
          </div>
        </div>
      )}

      {/* Sound Toggle Button */}
      <button
        onClick={() => setSoundEnabled(!soundEnabled)}
        className={`fixed top-4 right-4 z-40 p-3 rounded-full transition-all duration-300 ${soundEnabled
          ? "bg-green-600/20 border border-green-500/30 text-green-400"
          : "bg-red-600/20 border border-red-500/30 text-red-400"
          }`}
        title={soundEnabled ? "Suara Aktif" : "Suara Nonaktif"}
      >
        {soundEnabled ? (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
          </svg>
        ) : (
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
          </svg>
        )}
      </button>

      {/* Header - 2 Column Layout */}
      <header className="mb-8 md:mb-12">
        {/* Online Status */}
        <div className="flex items-center justify-center gap-3 mb-6">
          <div className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
          <span className="text-green-400 text-sm font-medium tracking-wider uppercase">Online</span>
        </div>

        {/* 2 Column Grid */}
        <div className="max-w-6xl mx-auto glass rounded-3xl p-6 md:p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-0">

            {/* Left Column - Welcome Text */}
            <div className="text-center md:text-left md:pr-8 md:border-r md:border-white/10">
              <h2 className="text-base md:text-lg lg:text-xl font-medium text-slate-400 tracking-wide mb-2">
                PENGADILAN AGAMA TARAKAN
              </h2>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-black text-white tracking-tight mb-2">
                SELAMAT DATANG
              </h1>
              <p className="text-lg md:text-xl lg:text-2xl font-light text-blue-400">
                Pelayanan Terpadu Satu Pintu
              </p>
            </div>

            {/* Right Column - Date & Time */}
            <div className="text-center md:text-right md:pl-8 flex flex-col justify-center">
              <p className="text-slate-300 text-base md:text-lg mb-2">
                {currentTime ? formatDate(currentTime) : ""}
              </p>
              <p className="text-4xl md:text-5xl lg:text-6xl font-mono font-bold text-white tracking-wider">
                {currentTime ? formatTime(currentTime) : "--:--:--"}
              </p>
            </div>

          </div>
        </div>
      </header>

      {/* Queue Display Grid */}
      <main className="max-w-7xl mx-auto">
        {/* 4 Lokets in 2x2 Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {loket1 && (
            <QueueCard
              loketName={loket1.name}
              prefix={loket1.prefix}
              currentNumber={loket1.currentNumber}
              lastCalled={loket1.lastCalled}
              variant="primary"
            />
          )}
          {loket2 && (
            <QueueCard
              loketName={loket2.name}
              prefix={loket2.prefix}
              currentNumber={loket2.currentNumber}
              lastCalled={loket2.lastCalled}
              variant="secondary"
            />
          )}
          {loket3 && (
            <QueueCard
              loketName={loket3.name}
              prefix={loket3.prefix}
              currentNumber={loket3.currentNumber}
              lastCalled={loket3.lastCalled}
              variant="primary"
            />
          )}
          {loket4 && (
            <QueueCard
              loketName={loket4.name}
              prefix={loket4.prefix}
              currentNumber={loket4.currentNumber}
              lastCalled={loket4.lastCalled}
              variant="accent"
            />
          )}
        </div>
      </main>

      {/* Footer - Operator Link */}
      <footer className="mt-8 md:mt-12 text-center">
        <Link
          href="/loket"
          className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-300 transition-colors text-sm"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          Panel Operator
        </Link>
      </footer>
    </div>
  );
}
