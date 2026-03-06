import { create } from 'zustand';
import i18n from '../i18n';
import type { Business, Customer, Transaction, DashboardStats } from '../types';

interface AppState {
    /** Auth */
    isLoggedIn: boolean;
    phone: string;
    businessId: string;
    token: string | null; // JWT token
    otpSent: boolean;

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

export const useAppStore = create<AppState>((set) => ({
    isLoggedIn: false,
    phone: '',
    businessId: '',
    token: null,
    otpSent: false,
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
    logout: () => set({ isLoggedIn: false, token: null, businessId: '', phone: '' }),

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

            // Total udhar (all credit transactions)
            if (txn.type === 'credit') {
                totalUdhar += txn.price;
            }

            // This week total
            if (txnDate >= weekStart) {
                thisWeek += txn.price;
            }
        });

        set({
            dashboardStats: {
                todaySales: Math.round(todaySales),
                totalUdhar: Math.round(totalUdhar),
                thisWeek: Math.round(thisWeek),
            },
        });
    },
}));
