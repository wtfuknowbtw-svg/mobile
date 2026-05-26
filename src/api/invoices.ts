import { apiGet, apiPost, apiDelete } from '../lib/apiClient';
import { API_BASE_URL } from '../constants';
import type { Invoice } from '../types';

export const getInvoices = async (
    month: number,
    year: number
): Promise<{ data?: Invoice[]; summary?: { totalRevenue: number; totalInvoices: number }; error?: string }> => {
    const response = await apiGet<{ data: Invoice[]; summary: { totalRevenue: number; totalInvoices: number } }>(
        `/invoices/list?month=${month}&year=${year}`
    );
    if (response.error) {
        return { error: response.error };
    }
    return {
        data: response.data?.data,
        summary: response.data?.summary,
    };
};

export const createInvoice = async (payload: {
    customerName: string;
    customerPhone?: string | null;
    customerAddress?: string | null;
    items: { itemName: string; quantity: number; unit: string; pricePerUnit: number }[];
    gstRate: number;
    notes?: string | null;
    invoiceDate?: string | null;
}): Promise<{ data?: Invoice; error?: string }> => {
    const response = await apiPost<{ data: Invoice }>('/invoices/create', payload);
    if (response.error) {
        return { error: response.error };
    }
    return { data: response.data?.data };
};

export const getInvoice = async (id: string): Promise<{ data?: Invoice; error?: string }> => {
    const response = await apiGet<{ data: Invoice }>(`/invoices/${id}`);
    if (response.error) {
        return { error: response.error };
    }
    return { data: response.data?.data };
};

export const deleteInvoice = async (id: string): Promise<{ success?: boolean; error?: string }> => {
    const response = await apiDelete<{ success: boolean }>(`/invoices/${id}`);
    if (response.error) {
        return { error: response.error };
    }
    return { success: response.data?.success };
};

export const getInvoicePdfUrl = (id: string): string => {
    return `${API_BASE_URL}/invoices/${id}/pdf`;
};
