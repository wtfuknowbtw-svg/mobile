import { apiGet, apiPost } from '../lib/apiClient';
import type { Customer } from '../types';

export const getCustomers = async (businessId?: string): Promise<{ data?: Customer[]; error?: string }> => {
    const response = await apiGet<Customer[]>('/customers');
    
    if (response.error) {
        return { error: response.error };
    }

    // Backend returns data in the format { data: Customer[] }
    const customers = response.data?.data || response.data || [];
    
    return { data: customers };
};

export const getCustomer = async (id: string): Promise<{ data?: Customer; error?: string }> => {
    const response = await apiGet<Customer>(`/customers?id=${id}`);
    
    if (response.error) {
        return { error: response.error };
    }

    return { data: response.data?.data || response.data as Customer };
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

    return { data: response.data?.data || response.data as Customer };
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

import type { Transaction } from '../types';

export const getCustomerTransactions = async (
    customerId: string
): Promise<{ data?: Transaction[]; error?: string }> => {
    // Get all transactions and filter by customerId on the client side
    // In the future, we can add a backend endpoint for this
    const response = await apiGet<{ data: Transaction[] }>('/transactions');
    
    if (response.error) {
        return { error: response.error };
    }

    const allTransactions = response.data?.data || [];
    const customerTransactions = allTransactions.filter((t) => t.customerId === customerId);
    
    return { data: customerTransactions };
};
