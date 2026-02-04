"use client";

interface OperatorPanelProps {
    loketName: string;
    prefix: string;
    currentNumber: number;
    onCallNext: () => void;
    onRecall: () => void;
    onReset: () => void;
}

export function OperatorPanel({
    loketName,
    prefix,
    currentNumber,
    onCallNext,
    onRecall,
    onReset,
}: OperatorPanelProps) {
    const formatNumber = (num: number) => {
        return num.toString().padStart(3, "0");
    };

    return (
        <div className="flex flex-col gap-6">
            {/* Current Number Display */}
            <div className="rounded-3xl bg-gradient-to-br from-slate-800 to-slate-900 p-8 shadow-2xl">
                <div className="text-center">
                    <p className="text-slate-400 text-lg mb-2">Nomor Antrian Saat Ini</p>
                    <div className="text-6xl md:text-8xl font-black text-white tracking-tight">
                        {currentNumber > 0 ? (
                            <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                                {prefix}-{formatNumber(currentNumber)}
                            </span>
                        ) : (
                            <span className="text-slate-600">---</span>
                        )}
                    </div>
                    <p className="text-slate-500 mt-4">{loketName}</p>
                </div>
            </div>

            {/* Control Buttons */}
            <div className="grid gap-4">
                {/* Call Next - Primary Action */}
                <button
                    onClick={onCallNext}
                    className="
            group relative overflow-hidden rounded-2xl
            bg-gradient-to-r from-blue-600 to-blue-700
            px-8 py-6 text-xl font-bold text-white
            shadow-lg shadow-blue-500/30
            transition-all duration-300
            hover:shadow-xl hover:shadow-blue-500/40 hover:scale-[1.02]
            active:scale-[0.98]
          "
                >
                    <span className="relative z-10 flex items-center justify-center gap-3">
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                        </svg>
                        Panggil Berikutnya
                    </span>
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-500 to-cyan-500 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </button>

                {/* Secondary Actions */}
                <div className="grid grid-cols-2 gap-4">
                    <button
                        onClick={onRecall}
                        disabled={currentNumber === 0}
                        className="
              rounded-xl bg-slate-700 px-6 py-4 text-lg font-semibold text-white
              transition-all duration-200
              hover:bg-slate-600 disabled:opacity-50 disabled:cursor-not-allowed
              active:scale-[0.98]
            "
                    >
                        <span className="flex items-center justify-center gap-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Panggil Ulang
                        </span>
                    </button>

                    <button
                        onClick={onReset}
                        className="
              rounded-xl bg-red-600/20 border border-red-500/30 px-6 py-4 text-lg font-semibold text-red-400
              transition-all duration-200
              hover:bg-red-600/30 hover:text-red-300
              active:scale-[0.98]
            "
                    >
                        <span className="flex items-center justify-center gap-2">
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                            Reset
                        </span>
                    </button>
                </div>
            </div>

            {/* Statistics */}
            <div className="rounded-2xl bg-slate-800/50 p-6">
                <h3 className="text-slate-400 text-sm font-medium mb-3">Statistik Hari Ini</h3>
                <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                        <p className="text-3xl font-bold text-white">{currentNumber}</p>
                        <p className="text-slate-500 text-sm">Total Dilayani</p>
                    </div>
                    <div className="text-center">
                        <p className="text-3xl font-bold text-emerald-400">Aktif</p>
                        <p className="text-slate-500 text-sm">Status Loket</p>
                    </div>
                </div>
            </div>
        </div>
    );
}
