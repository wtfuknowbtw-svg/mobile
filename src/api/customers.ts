import { apiGet, apiPost, apiPut } from '../lib/apiClient';
import type { Customer, Transaction } from '../types';

export const getCustomers = async (businessId?: string): Promise<{ data?: Customer[]; error?: string }> => {
    const response = await apiGet<{ data: Customer[] }>('/customers');
    
    if (response.error) {
        return { error: response.error };
    }

    // Backend returns data in the format { data: Customer[] }
    const customers = response.data?.data || [];
    
    return { data: customers };
};

export const getCustomer = async (id: string): Promise<{ data?: Customer; error?: string }> => {
    const response = await apiGet<{ data: Customer }>(`/customers?id=${id}`);
    
    if (response.error) {
        return { error: response.error };
    }

    return { data: response.data?.data };
};

export const createCustomer = async (
    customer: { name: string; phone?: string; businessId?: string }
): Promise<{ data?: Customer; error?: string }> => {
    const response = await apiPost<{ data: Customer; message?: string }>('/customers', {
        name: customer.name,
        phone: customer.phone,
    });
    
    if (response.error) {
        return { error: response.error };
    }

    return { data: response.data?.data };
};

// Note: updateCustomerUdhar is handled automatically by the backend when transactions are created/updated
export const updateCustomerUdhar = async (
    customerId: string,
    amount: number
): Promise<{ error?: string }> => {
    // This is now handled automatically by the backend
    // Keeping for backward compatibility but it's a no-op
    return {};
};

export const updateCustomer = async (
    customer: { id: string; name?: string; phone?: string | null }
): Promise<{ data?: Customer; error?: string }> => {
    const response = await apiPut<{ data: Customer; message?: string }>('/customers', {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
    });

    if (response.error) {
        return { error: response.error };
    }

    return { data: response.data?.data };
};

export const getCustomerTransactions = async (
    customerId: string
): Promise<{ data?: Transaction[]; error?: string }> => {
    // Use the customer endpoint which returns customer object with transactions included
    const response = await apiGet<{ data: Customer }>(`/customers?id=${customerId}`);
    
    if (response.error) {
        return { error: response.error };
    }

    const customer = response.data?.data;
    return { data: customer?.transactions || [] };
};
