"use client";

// Queue announcement using Web Speech API with train station style chime
// Designed to sound natural like a human announcer

let isSpeaking = false;
let speechQueue: Array<{ text: string; onComplete: () => void }> = [];

// Process speech queue one at a time
function processSpeechQueue() {
    if (isSpeaking || speechQueue.length === 0) return;

    const item = speechQueue.shift();
    if (!item) return;

    isSpeaking = true;

    if (typeof window === "undefined" || !("speechSynthesis" in window)) {
        isSpeaking = false;
        item.onComplete();
        processSpeechQueue();
        return;
    }

    // Cancel any ongoing speech first
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(item.text);

    // Configure for natural human-like speech
    utterance.lang = "id-ID";
    utterance.rate = 0.85; // Slower for clarity
    utterance.pitch = 1.0;
    utterance.volume = 1;

    // Try to find Indonesian voice
    const voices = window.speechSynthesis.getVoices();
    const indonesianVoice = voices.find(v => v.lang.startsWith("id"));
    if (indonesianVoice) {
        utterance.voice = indonesianVoice;
    }

    utterance.onend = () => {
        isSpeaking = false;
        item.onComplete();
        // Wait a moment before next announcement
        setTimeout(() => processSpeechQueue(), 300);
    };

    utterance.onerror = () => {
        isSpeaking = false;
        item.onComplete();
        setTimeout(() => processSpeechQueue(), 300);
    };

    window.speechSynthesis.speak(utterance);
}

export function useQueueAnnouncement() {

    // Play train station style chime
    const playTrainStationChime = (): Promise<void> => {
        return new Promise((resolve) => {
            if (typeof window === "undefined") {
                resolve();
                return;
            }

            try {
                const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
                const audioContext = new AudioContextClass();

                // Classic ding-dong-ding-dong pattern (like train stations)
                const notes = [
                    { freq: 830.6, time: 0, duration: 0.5 },      // G#5
                    { freq: 622.3, time: 0.55, duration: 0.5 },   // D#5
                    { freq: 830.6, time: 1.1, duration: 0.5 },    // G#5
                    { freq: 622.3, time: 1.65, duration: 0.7 },   // D#5 (longer)
                ];

                notes.forEach(note => {
                    const oscillator = audioContext.createOscillator();
                    const gainNode = audioContext.createGain();

                    oscillator.connect(gainNode);
                    gainNode.connect(audioContext.destination);

                    // Use sine wave for bell-like sound
                    oscillator.type = "sine";
                    oscillator.frequency.setValueAtTime(note.freq, audioContext.currentTime + note.time);

                    // Bell-like envelope: quick attack, slow decay
                    gainNode.gain.setValueAtTime(0, audioContext.currentTime + note.time);
                    gainNode.gain.linearRampToValueAtTime(0.4, audioContext.currentTime + note.time + 0.02);
                    gainNode.gain.setValueAtTime(0.35, audioContext.currentTime + note.time + 0.1);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + note.time + note.duration);

                    oscillator.start(audioContext.currentTime + note.time);
                    oscillator.stop(audioContext.currentTime + note.time + note.duration + 0.1);
                });

                // Resolve after chime completes
                setTimeout(() => {
                    audioContext.close();
                    resolve();
                }, 2500);

            } catch (e) {
                console.warn("Could not play chime:", e);
                resolve();
            }
        });
    };

    // Speak text with proper queueing
    const speak = (text: string): Promise<void> => {
        return new Promise((resolve) => {
            speechQueue.push({ text, onComplete: resolve });
            processSpeechQueue();
        });
    };

    // Format announcement text to sound natural
    const formatAnnouncementText = (loketName: string, prefix: string, number: number): string => {
        const formattedNumber = number.toString().padStart(3, "0");

        // Read digits individually with pauses for clarity
        // "Nomor antrian A, nol, nol, satu, silakan menuju ke loket satu"
        const digitWords: { [key: string]: string } = {
            "0": "nol",
            "1": "satu",
            "2": "dua",
            "3": "tiga",
            "4": "empat",
            "5": "lima",
            "6": "enam",
            "7": "tujuh",
            "8": "delapan",
            "9": "sembilan",
        };

        const digits = formattedNumber
            .split("")
            .map(d => digitWords[d] || d)
            .join(", ");

        return `Nomor antrian ${prefix}, ${digits}, silakan menuju ke ${loketName}`;
    };

    const announceWithChime = async (loketName: string, prefix: string, number: number): Promise<void> => {
        // Don't start new announcement if already speaking
        if (isSpeaking) {
            return;
        }

        // Play chime first
        await playTrainStationChime();

        // Small pause after chime
        await new Promise(resolve => setTimeout(resolve, 400));

        // Speak the announcement
        const text = formatAnnouncementText(loketName, prefix, number);
        await speak(text);

        // Pause after announcement
        await new Promise(resolve => setTimeout(resolve, 500));
    };

    return { speak, announceWithChime, playTrainStationChime };
}
