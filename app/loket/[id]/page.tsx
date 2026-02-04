"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import { useQueue } from "../../context/QueueContext";
import { OperatorPanel } from "../../components/OperatorPanel";

export default function LoketOperatorPage() {
    const params = useParams();
    const loketId = params.id as string;
    const { getLoket, callNext, recallCurrent, resetQueue, isLoading } = useQueue();

    const loket = getLoket(loketId);

    const getGradient = (id: string) => {
        switch (id) {
            case "loket-1":
                return "from-blue-600 to-blue-800";
            case "loket-2":
                return "from-emerald-600 to-emerald-800";
            case "loket-3":
                return "from-indigo-600 to-indigo-800";
            case "kasir":
                return "from-amber-500 to-orange-600";
            default:
                return "from-slate-600 to-slate-800";
        }
    };

    // Loading state
    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-slate-400">Memuat...</p>
                </div>
            </div>
        );
    }

    // Loket not found
    if (!loket) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
                <div className="text-center">
                    <h1 className="text-2xl font-bold text-white mb-4">Loket tidak ditemukan</h1>
                    <p className="text-slate-400 mb-4">ID: {loketId}</p>
                    <Link
                        href="/loket"
                        className="text-blue-400 hover:text-blue-300 transition-colors"
                    >
                        Kembali ke daftar loket
                    </Link>
                </div>
            </div>
        );
    }

    const handleCallNext = () => {
        console.log("Calling next for:", loketId);
        callNext(loketId);
    };

    const handleRecall = () => {
        console.log("Recalling for:", loketId);
        recallCurrent(loketId);
    };

    const handleReset = () => {
        if (confirm(`Reset antrian ${loket.name}?`)) {
            console.log("Resetting for:", loketId);
            resetQueue(loketId);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
            {/* Header */}
            <header className={`bg-gradient-to-r ${getGradient(loketId)} px-6 py-6 shadow-xl`}>
                <div className="max-w-2xl mx-auto">
                    <Link
                        href="/loket"
                        className="inline-flex items-center gap-2 text-white/70 hover:text-white transition-colors mb-4"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Kembali
                    </Link>

                    <div className="flex items-center justify-between">
                        <div>
                            <h1 className="text-3xl md:text-4xl font-bold text-white">
                                {loket.name}
                            </h1>
                            <p className="text-white/70 mt-1">
                                Panel Operator Antrian
                            </p>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="h-3 w-3 rounded-full bg-green-400 animate-pulse" />
                            <span className="text-white/80 text-sm font-medium">Aktif</span>
                        </div>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="max-w-2xl mx-auto p-6">
                <OperatorPanel
                    loketName={loket.name}
                    prefix={loket.prefix}
                    currentNumber={loket.currentNumber}
                    onCallNext={handleCallNext}
                    onRecall={handleRecall}
                    onReset={handleReset}
                />
            </main>

            {/* Quick Link to Display */}
            <footer className="fixed bottom-6 right-6">
                <Link
                    href="/"
                    target="_blank"
                    className="
            inline-flex items-center gap-2 px-4 py-3
            rounded-full bg-white/10 backdrop-blur-sm border border-white/20
            text-white text-sm font-medium
            transition-all duration-200
            hover:bg-white/20
          "
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    Lihat Display
                </Link>
            </footer>
        </div>
    );
}
