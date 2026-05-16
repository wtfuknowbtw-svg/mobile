import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import i18n from '../i18n';
import type { Business, Customer, Transaction, DashboardStats } from '../types';

interface AppState {
    /** Auth */
    isLoggedIn: boolean;
    phone: string;
    businessId: string;
    token: string | null; // JWT token
    otpSent: boolean;
    hasHydrated: boolean;

    /** Language */
    language: string;

    /** Business profile */
    business: Business | null;

    /** Dashboard (computed from transactions) */
    dashboardStats: DashboardStats;

    /** Actions */
    setLanguage: (lang: string) => void;
    setPhone: (phone: string) => void;
    setBusinessId: (id: string) => void;
    setToken: (token: string | null) => void;
    setOtpSent: (sent: boolean) => void;
    setLoggedIn: (loggedIn: boolean) => void;
    setBusiness: (business: Business) => void;
    setDashboardStats: (stats: DashboardStats) => void;
    logout: () => void;

    /** Compute stats from actual transactions */
    computeStats: (transactions: Transaction[]) => void;
}

export const useAppStore = create<AppState>()(
    persist(
        (set, get) => ({
            isLoggedIn: false,
            phone: '',
            businessId: '',
            token: null,
            otpSent: false,
            hasHydrated: false,
            language: 'hi',
            business: null,
            dashboardStats: {
                todaySales: 0,
                totalUdhar: 0,
                thisWeek: 0,
            },

            setLanguage: (lang) => {
                i18n.locale = lang;
                set({ language: lang });
            },
            setPhone: (phone) => set({ phone }),
            setBusinessId: (id) => set({ businessId: id }),
            setToken: (token) => set({ token }),
            setOtpSent: (sent) => set({ otpSent: sent }),
            setLoggedIn: (loggedIn) => set({ isLoggedIn: loggedIn }),
            setBusiness: (business) => set({ business }),
            setDashboardStats: (stats) => set({ dashboardStats: stats }),
            logout: () => set({ isLoggedIn: false, token: null, businessId: '', phone: '', business: null }),

            computeStats: (transactions: Transaction[]) => {
                const now = new Date();
                const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                const weekStart = new Date(todayStart);
                weekStart.setDate(weekStart.getDate() - 7);

                let todaySales = 0;
                let totalUdhar = 0;
                let thisWeek = 0;

                transactions.forEach((txn) => {
                    const txnDate = new Date(txn.date);

                    // Today's sales (cash transactions today)
                    if (txnDate >= todayStart && txn.type === 'cash') {
                        todaySales += txn.price;
                    }

                    // Total udhar (credit adds, cash/udhar_payment subtracts)
                    if (txn.type === 'credit') {
                        totalUdhar += txn.price;
                    } else if (txn.type === 'cash' || txn.type === 'udhar_payment') {
                        totalUdhar -= txn.price;
                    }

                    // This week total (only cash and credit, not expenses)
                    if (txnDate >= weekStart && (txn.type === 'cash' || txn.type === 'credit')) {
                        thisWeek += txn.price;
                    }
                });

                const currentStats = get().dashboardStats;
                const newTodaySales = Math.round(todaySales);
                const newTotalUdhar = Math.round(totalUdhar);
                const newThisWeek = Math.round(thisWeek);

                // Only update if values actually changed to prevent infinite loops
                if (
                    currentStats.todaySales !== newTodaySales ||
                    currentStats.totalUdhar !== newTotalUdhar ||
                    currentStats.thisWeek !== newThisWeek
                ) {
                    set({
                        dashboardStats: {
                            todaySales: newTodaySales,
                            totalUdhar: newTotalUdhar,
                            thisWeek: newThisWeek,
                        },
                    });
                }
            },
        }),
        {
            name: 'apna-khata-storage',
            storage: createJSONStorage(() => AsyncStorage),
            // Only persist these fields
            partialize: (state) => ({
                isLoggedIn: state.isLoggedIn,
                phone: state.phone,
                businessId: state.businessId,
                token: state.token,
                language: state.language,
                business: state.business,
            }),
            onRehydrateStorage: () => (state) => {
                console.log('🔄 Zustand rehydrating from AsyncStorage...');
                if (state) {
                    state.hasHydrated = true;
                    // Set i18n locale based on stored language
                    i18n.locale = state.language || 'hi';
                    console.log('✅ Zustand hydrated successfully');
                    console.log('📊 Hydrated state:', {
                        isLoggedIn: state.isLoggedIn,
                        phone: state.phone,
                        businessId: state.businessId,
                        hasToken: !!state.token,
                        language: state.language,
                    });
                }
            },
        }
    )
);
