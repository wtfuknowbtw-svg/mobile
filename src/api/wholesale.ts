import { apiGet, apiPost, apiDelete } from '../lib/apiClient';

export interface WholesalePurchase {
  id: string;
  businessId: string;
  itemName: string;
  quantity: number;
  unit: string;
  totalPrice: number;
  supplierName?: string;
  purchaseDate: string;
  createdAt: string;
}

export interface WholesaleSummary {
  totalSpent: number;
  totalItems: number;
}

export const getWholesalePurchases = async (
  month: number,
  year: number
): Promise<{ data?: WholesalePurchase[]; summary?: WholesaleSummary; error?: string }> => {
  try {
    const response = await apiGet<{ data: WholesalePurchase[]; summary: WholesaleSummary }>(
      `/wholesale/list?month=${month}&year=${year}`
    );
    
    if (response.error) {
      if (response.error.includes('Network request failed') || response.error.includes('Network error') || response.error.includes('network error')) {
        throw { code: 'NETWORK_ERROR', message: 'No internet connection' };
      }
      return { error: response.error };
    }

    return { 
      data: response.data?.data || [],
      summary: response.data?.summary || { totalSpent: 0, totalItems: 0 }
    };
  } catch (error: any) {
    if (error && error.code === 'NETWORK_ERROR') {
      throw error;
    }
    if (error instanceof TypeError && error.message.includes('Network request failed')) {
      throw { code: 'NETWORK_ERROR', message: 'No internet connection' };
    }
    throw error;
  }
};

export const addWholesalePurchase = async (
  purchase: {
    itemName: string;
    quantity: number;
    unit: string;
    totalPrice: number;
    supplierName?: string;
    purchaseDate?: string;
  }
): Promise<{ data?: WholesalePurchase; error?: string }> => {
  const response = await apiPost<{ data: WholesalePurchase }>('/wholesale/add', purchase);
  
  if (response.error) {
    return { error: response.error };
  }

  return { data: response.data?.data };
};

export const deleteWholesalePurchase = async (id: string): Promise<{ error?: string }> => {
  const response = await apiDelete<{ success: boolean }>(`/wholesale/${id}`);
  
  if (response.error) {
    return { error: response.error };
  }

  return {};
};
