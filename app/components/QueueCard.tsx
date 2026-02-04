"use client";

import { useEffect, useState } from "react";

interface QueueCardProps {
    loketName: string;
    prefix: string;
    currentNumber: number;
    lastCalled: number | null;
    variant?: "primary" | "secondary" | "accent";
}

export function QueueCard({ loketName, prefix, currentNumber, lastCalled, variant = "primary" }: QueueCardProps) {
    const [isAnimating, setIsAnimating] = useState(false);

    // Trigger animation when number changes
    useEffect(() => {
        if (lastCalled) {
            setIsAnimating(true);
            const timer = setTimeout(() => setIsAnimating(false), 2000);
            return () => clearTimeout(timer);
        }
    }, [lastCalled, currentNumber]);

    const formatNumber = (num: number) => {
        return num.toString().padStart(3, "0");
    };

    const bgColors = {
        primary: "from-blue-600 to-blue-800",
        secondary: "from-emerald-600 to-emerald-800",
        accent: "from-amber-500 to-orange-600",
    };

    const glowColors = {
        primary: "shadow-blue-500/50",
        secondary: "shadow-emerald-500/50",
        accent: "shadow-orange-500/50",
    };

    return (
        <div
            className={`
        relative overflow-hidden rounded-3xl bg-gradient-to-br ${bgColors[variant]}
        p-6 md:p-8 shadow-2xl ${isAnimating ? glowColors[variant] : ""}
        transition-all duration-500 transform
        ${isAnimating ? "scale-105 shadow-[0_0_60px_rgba(59,130,246,0.5)]" : "scale-100"}
      `}
        >
            {/* Background decoration */}
            <div className="absolute inset-0 opacity-10">
                <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white blur-3xl" />
                <div className="absolute -bottom-10 -left-10 h-32 w-32 rounded-full bg-white blur-2xl" />
            </div>

            {/* Content */}
            <div className="relative z-10 flex flex-col items-center justify-center text-white">
                {/* Loket Name */}
                <h2 className="text-xl md:text-2xl font-bold tracking-wider mb-4 opacity-90">
                    {loketName}
                </h2>

                {/* Queue Number */}
                <div
                    className={`
            text-5xl md:text-7xl lg:text-8xl font-black tracking-tight
            transition-all duration-300
            ${isAnimating ? "animate-pulse" : ""}
          `}
                >
                    {prefix}-{formatNumber(currentNumber)}
                </div>

                {/* Status indicator */}
                <div className="mt-4 flex items-center gap-2">
                    <span className={`h-3 w-3 rounded-full ${currentNumber > 0 ? "bg-green-400 animate-pulse" : "bg-gray-400"}`} />
                    <span className="text-sm opacity-75">
                        {currentNumber > 0 ? "Melayani" : "Menunggu"}
                    </span>
                </div>
            </div>

            {/* Animated border for active call */}
            {isAnimating && (
                <div className="absolute inset-0 rounded-3xl border-4 border-white/30 animate-ping" />
            )}
        </div>
    );
}
