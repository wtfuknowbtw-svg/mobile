import { apiGet, apiPost, apiPut, apiDelete } from '../lib/apiClient';

export interface Purchase {
  id: string;
  businessId: string;
  supplierName?: string;
  itemName: string;
  quantity: number;
  unit?: string;
  costPrice: number;
  totalCost: number;
  date: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PurchaseSummary {
  totalPurchaseCost: number;
  totalSalesRevenue: number;
  profitLoss: number;
  itemWiseSummary: {
    itemName: string;
    totalBought: number;
    totalSold: number;
    difference: number;
    unit: string;
  }[];
  itemWiseTracking?: {
    itemName: string;
    purchased: {
      quantity: number;
      unit: string;
      cost: number;
      convertedQuantity: number;
      convertedUnit: string;
    };
    sold: {
      quantity: number;
      unit: string;
      revenue: number;
    };
    remaining: number;
    remainingUnit: string;
    isMissing: boolean;
    missingQuantity: number;
    unitMismatch: boolean;
    conversionUsed: string;
  }[];
}

export const getPurchases = async (filter: string = 'all'): Promise<{ data?: Purchase[]; summary?: any; error?: string }> => {
  try {
    const response = await apiGet<{ data: Purchase[]; summary: any }>(`/purchases?filter=${filter}`);
    
    if (response.error) {
      if (response.error.includes('Network request failed') || response.error.includes('Network error') || response.error.includes('network error')) {
        throw { code: 'NETWORK_ERROR', message: 'No internet connection' };
      }
      return { error: response.error };
    }

    return { 
      data: response.data?.data || [],
      summary: response.data?.summary || {}
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

export const createPurchase = async (
  purchase: Omit<Purchase, 'id' | 'createdAt' | 'updatedAt' | 'businessId'>
): Promise<{ data?: Purchase; error?: string }> => {
  const response = await apiPost<{ data: Purchase; message?: string }>('/purchases', purchase);
  
  if (response.error) {
    return { error: response.error };
  }

  return { data: response.data?.data };
};

export const updatePurchase = async (
  id: string,
  updates: Partial<Purchase>
): Promise<{ data?: Purchase; error?: string }> => {
  const response = await apiPut<{ data: Purchase; message?: string }>(`/purchases/${id}`, updates);
  
  if (response.error) {
    return { error: response.error };
  }

  return { data: response.data?.data };
};

export const deletePurchase = async (id: string): Promise<{ error?: string }> => {
  const response = await apiDelete<{ message?: string }>(`/purchases/${id}`);
  
  if (response.error) {
    return { error: response.error };
  }

  return {};
};

export const getPurchasesSummary = async (filter: string = 'month'): Promise<{ data?: PurchaseSummary; error?: string }> => {
  try {
    const response = await apiGet<{ data: PurchaseSummary }>(`/purchases/summary?filter=${filter}`);
    
    if (response.error) {
      if (response.error.includes('Network request failed') || response.error.includes('Network error') || response.error.includes('network error')) {
        throw { code: 'NETWORK_ERROR', message: 'No internet connection' };
      }
      return { error: response.error };
    }

    return { data: response.data?.data };
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
