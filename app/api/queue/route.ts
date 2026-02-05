import { kv } from "@vercel/kv";
import { NextResponse } from "next/server";

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
    lastResetDate: string; // Format: YYYY-MM-DD (timezone Asia/Jakarta)
}

const QUEUE_KEY = "antrian-ptsp-queue";

// Helper function to get current date in Asia/Jakarta timezone
function getCurrentDateString(): string {
    const now = new Date();
    const jakartaTime = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
    const year = jakartaTime.getFullYear();
    const month = String(jakartaTime.getMonth() + 1).padStart(2, "0");
    const day = String(jakartaTime.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

// Helper function to reset queue state
function getResetState(currentVersion: number): QueueState {
    return {
        lokets: [
            { id: "loket-1", name: "LOKET 1", prefix: "A", currentNumber: 0, lastCalled: null, isActive: true, sharedQueue: true },
            { id: "loket-2", name: "LOKET 2", prefix: "A", currentNumber: 0, lastCalled: null, isActive: true, sharedQueue: true },
            { id: "loket-3", name: "LOKET 3", prefix: "A", currentNumber: 0, lastCalled: null, isActive: true, sharedQueue: true },
            { id: "loket-4", name: "LOKET 4", prefix: "A", currentNumber: 0, lastCalled: null, isActive: true, sharedQueue: true },
        ],
        sharedQueueCounter: 0,
        kasirCounter: 0,
        lastUpdate: Date.now(),
        version: currentVersion + 1,
        lastResetDate: getCurrentDateString(),
    };
}

// Initial state
const initialState: QueueState = {
    lokets: [
        { id: "loket-1", name: "LOKET 1", prefix: "A", currentNumber: 0, lastCalled: null, isActive: true, sharedQueue: true },
        { id: "loket-2", name: "LOKET 2", prefix: "A", currentNumber: 0, lastCalled: null, isActive: true, sharedQueue: true },
        { id: "loket-3", name: "LOKET 3", prefix: "A", currentNumber: 0, lastCalled: null, isActive: true, sharedQueue: true },
        { id: "loket-4", name: "LOKET 4", prefix: "A", currentNumber: 0, lastCalled: null, isActive: true, sharedQueue: true },
    ],
    sharedQueueCounter: 0,
    kasirCounter: 0,
    lastUpdate: 0,
    version: 0,
    lastResetDate: getCurrentDateString(),
};

// Check if queue needs daily reset
function needsDailyReset(state: QueueState): boolean {
    const currentDate = getCurrentDateString();
    return !state.lastResetDate || state.lastResetDate !== currentDate;
}

// GET - Fetch current queue state
export async function GET() {
    try {
        let state = await kv.get<QueueState>(QUEUE_KEY);

        if (!state) {
            // Initialize with default state
            await kv.set(QUEUE_KEY, initialState);
            return NextResponse.json(initialState);
        }

        // Check if we need to reset for a new day
        if (needsDailyReset(state)) {
            console.log(`Daily reset triggered. Previous date: ${state.lastResetDate}, Current date: ${getCurrentDateString()}`);
            state = getResetState(state.version);
            await kv.set(QUEUE_KEY, state);
        }

        return NextResponse.json(state);
    } catch (error) {
        console.error("Error fetching queue state:", error);
        return NextResponse.json(initialState);
    }
}

// POST - Update queue state
export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { action, loketId } = body;

        // Get current state
        let state = await kv.get<QueueState>(QUEUE_KEY);
        if (!state) {
            state = { ...initialState };
        }

        switch (action) {
            case "callNext": {
                const loket = state.lokets.find(l => l.id === loketId);
                if (loket) {
                    let newNumber: number;
                    if (loket.sharedQueue) {
                        state.sharedQueueCounter += 1;
                        newNumber = state.sharedQueueCounter;
                    } else {
                        state.kasirCounter += 1;
                        newNumber = state.kasirCounter;
                    }

                    state.lokets = state.lokets.map(l => {
                        if (l.id === loketId) {
                            return { ...l, currentNumber: newNumber, lastCalled: Date.now() };
                        }
                        return l;
                    });
                }
                break;
            }

            case "recallCurrent": {
                state.lokets = state.lokets.map(l => {
                    if (l.id === loketId) {
                        return { ...l, lastCalled: Date.now() };
                    }
                    return l;
                });
                break;
            }

            case "resetQueue": {
                const loket = state.lokets.find(l => l.id === loketId);
                if (loket?.sharedQueue) {
                    state.sharedQueueCounter = 0;
                    state.lokets = state.lokets.map(l => {
                        if (l.sharedQueue) {
                            return { ...l, currentNumber: 0, lastCalled: null };
                        }
                        return l;
                    });
                } else {
                    state.kasirCounter = 0;
                    state.lokets = state.lokets.map(l => {
                        if (l.id === loketId) {
                            return { ...l, currentNumber: 0, lastCalled: null };
                        }
                        return l;
                    });
                }
                break;
            }

            case "resetAll": {
                state = getResetState(state.version);
                break;
            }
        }

        // Update version and timestamp
        state.version += 1;
        state.lastUpdate = Date.now();

        // Save to KV
        await kv.set(QUEUE_KEY, state);

        return NextResponse.json(state);
    } catch (error) {
        console.error("Error updating queue state:", error);
        return NextResponse.json({ error: "Failed to update" }, { status: 500 });
    }
}
