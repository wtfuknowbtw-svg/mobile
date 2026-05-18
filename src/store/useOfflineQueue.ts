import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createTransaction } from '../api/transactions';
import type { Transaction } from '../types';

export type CreateTransactionPayload = Omit<Transaction, 'id' | 'createdAt' | 'businessId'> & { businessId?: string };

export interface OfflineTransaction {
    localId: string;
    payload: CreateTransactionPayload;
    createdAt: string;
    retryCount: number;
    status: 'pending' | 'syncing' | 'failed';
}

interface OfflineQueueState {
    queue: OfflineTransaction[];
    isSyncing: boolean;
    lastSyncError: string | null;

    addToQueue: (payload: CreateTransactionPayload) => void;
    removeFromQueue: (localId: string) => void;
    markFailed: (localId: string, error: string) => void;
    clearFailed: () => void;
    retryAllFailed: () => void;
    syncQueue: () => Promise<void>;
}

export const useOfflineQueue = create<OfflineQueueState>()(
    persist(
        (set, get) => ({
            queue: [],
            isSyncing: false,
            lastSyncError: null,

            addToQueue: (payload) => {
                const localId = Math.random().toString(36).substring(2, 11); // Generate client-side localId
                const newItem: OfflineTransaction = {
                    localId,
                    payload,
                    createdAt: new Date().toISOString(),
                    retryCount: 0,
                    status: 'pending',
                };
                set((state) => ({
                    queue: [...state.queue, newItem],
                }));
            },

            removeFromQueue: (localId) => {
                set((state) => ({
                    queue: state.queue.filter((item) => item.localId !== localId),
                }));
            },

            markFailed: (localId, error) => {
                set((state) => {
                    const queue = state.queue.map((item) => {
                        if (item.localId === localId) {
                            const retryCount = item.retryCount + 1;
                            const status: 'pending' | 'failed' = retryCount >= 3 ? 'failed' : 'pending';
                            return { ...item, status, retryCount };
                        }
                        return item;
                    });
                    return { queue, lastSyncError: error };
                });
            },

            clearFailed: () => {
                set((state) => ({
                    queue: state.queue.filter((item) => item.status !== 'failed'),
                    lastSyncError: null,
                }));
            },

            retryAllFailed: () => {
                set((state) => ({
                    queue: state.queue.map((item) =>
                        item.status === 'failed'
                            ? { ...item, status: 'pending', retryCount: 0 }
                            : item
                    ),
                    lastSyncError: null,
                }));
                // Call syncQueue after resetting the failed ones
                get().syncQueue();
            },

            syncQueue: async () => {
                const { queue, isSyncing } = get();
                if (isSyncing) return;

                // Sync only pending items
                const itemsToSync = queue.filter((item) => item.status === 'pending');
                if (itemsToSync.length === 0) return;

                set({ isSyncing: true, lastSyncError: null });

                try {
                    for (const item of itemsToSync) {
                        // Optimistically set to syncing
                        set((state) => ({
                            queue: state.queue.map((q) =>
                                q.localId === item.localId ? { ...q, status: 'syncing' } : q
                            ),
                        }));

                        try {
                            const result = await createTransaction(item.payload);
                            if (result.error) {
                                throw new Error(result.error);
                            }
                            get().removeFromQueue(item.localId);
                        } catch (err) {
                            const errorMsg = err instanceof Error ? err.message : 'Network error';
                            get().markFailed(item.localId, errorMsg);
                        }
                    }
                } finally {
                    set({ isSyncing: false });
                }
            },
        }),
        {
            name: 'offline-queue',
            storage: createJSONStorage(() => AsyncStorage),
        }
    )
);
