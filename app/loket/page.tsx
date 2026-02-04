"use client";

import Link from "next/link";
import { useQueue } from "../context/QueueContext";

export default function LoketSelectionPage() {
    const { lokets, resetAll } = useQueue();

    const getGradient = (id: string) => {
        switch (id) {
            case "loket-1":
                return "from-blue-600 to-blue-700";
            case "loket-2":
                return "from-emerald-600 to-emerald-700";
            case "loket-3":
                return "from-indigo-600 to-indigo-700";
            case "loket-4":
                return "from-amber-500 to-orange-600";
            default:
                return "from-slate-600 to-slate-700";
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-6 md:p-8">
            {/* Header */}
            <header className="max-w-4xl mx-auto mb-8">
                <Link
                    href="/"
                    className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors mb-6"
                >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                    </svg>
                    Kembali ke Display
                </Link>

                <h1 className="text-3xl md:text-4xl font-bold text-white">
                    Panel Operator
                </h1>
                <p className="text-slate-400 mt-2">
                    Pilih loket yang ingin dioperasikan
                </p>
            </header>

            {/* Loket Grid */}
            <main className="max-w-4xl mx-auto">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    {lokets.map((loket) => (
                        <Link
                            key={loket.id}
                            href={`/loket/${loket.id}`}
                            className={`
                group relative overflow-hidden rounded-2xl
                bg-gradient-to-br ${getGradient(loket.id)}
                p-6 md:p-8 shadow-xl
                transition-all duration-300
                hover:scale-[1.02] hover:shadow-2xl
              `}
                        >
                            {/* Background decoration */}
                            <div className="absolute inset-0 opacity-10">
                                <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white blur-2xl" />
                            </div>

                            <div className="relative z-10">
                                <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                                    {loket.name}
                                </h2>
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-white/70 text-sm">Antrian saat ini</p>
                                        <p className="text-3xl font-bold text-white">
                                            {loket.currentNumber > 0
                                                ? `${loket.prefix}-${loket.currentNumber.toString().padStart(3, "0")}`
                                                : "---"
                                            }
                                        </p>
                                    </div>
                                    <div className="h-12 w-12 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-white/30 transition-colors">
                                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>

                {/* Reset All Button */}
                <div className="mt-8 text-center">
                    <button
                        onClick={() => {
                            if (confirm("Apakah Anda yakin ingin mereset semua antrian?")) {
                                resetAll();
                            }
                        }}
                        className="
              inline-flex items-center gap-2 px-6 py-3
              rounded-xl bg-red-600/20 border border-red-500/30
              text-red-400 font-medium
              transition-all duration-200
              hover:bg-red-600/30 hover:text-red-300
            "
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Reset Semua Antrian
                    </button>
                </div>
            </main>
        </div>
    );
}
