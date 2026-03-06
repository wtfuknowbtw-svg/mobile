import { apiGet, apiPost, apiPut, apiDelete } from '../lib/apiClient';
import type { Transaction } from '../types';

export const getTransactions = async (businessId?: string): Promise<{ data?: Transaction[]; error?: string }> => {
    const response = await apiGet<{ data: Transaction[] }>('/transactions');
    
    if (response.error) {
        return { error: response.error };
    }

    // Backend returns data in the format { data: Transaction[] }
    const transactions = response.data?.data || [];
    
    return { data: transactions };
};

export const createTransaction = async (
    transaction: Omit<Transaction, 'id' | 'createdAt' | 'businessId'> & { businessId?: string }
): Promise<{ data?: Transaction; error?: string }> => {
    const response = await apiPost<{ data: Transaction; message?: string }>('/transactions', transaction);
    
    if (response.error) {
        return { error: response.error };
    }

    return { data: response.data?.data };
};

export const updateTransaction = async (
    id: string,
    updates: Partial<Transaction>
): Promise<{ data?: Transaction; error?: string }> => {
    const response = await apiPut<{ data: Transaction; message?: string }>('/transactions', {
        id,
        ...updates,
    });
    
    if (response.error) {
        return { error: response.error };
    }

    return { data: response.data?.data };
};

export const deleteTransaction = async (id: string): Promise<{ error?: string }> => {
    const response = await apiDelete<{ message?: string }>(`/transactions?id=${id}`);
    
    if (response.error) {
        return { error: response.error };
    }

    return {};
};
