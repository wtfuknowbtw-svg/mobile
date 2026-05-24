import { apiGet, apiPost, apiPut, apiDelete } from '../lib/apiClient';

export interface UnitConversion {
  id: string;
  businessId: string;
  fromUnit: string;
  toUnit: string;
  multiplier: number;
  createdAt: string;
  updatedAt: string;
}

export const getUnitConversions = async (): Promise<{ data?: UnitConversion[]; error?: string }> => {
  const response = await apiGet<{ data: UnitConversion[] }>('/unit-conversions');
  if (response.error) {
    return { error: response.error };
  }
  return { data: response.data?.data || [] };
};

export const createUnitConversion = async (data: {
  fromUnit: string;
  toUnit: string;
  multiplier: number;
}): Promise<{ data?: UnitConversion; error?: string }> => {
  const response = await apiPost<{ data: UnitConversion }>('/unit-conversions', data);
  if (response.error) {
    return { error: response.error };
  }
  return { data: response.data?.data };
};

export const updateUnitConversion = async (
  id: string,
  data: { multiplier: number }
): Promise<{ data?: UnitConversion; error?: string }> => {
  const response = await apiPut<{ data: UnitConversion }>(`/unit-conversions/${id}`, data);
  if (response.error) {
    return { error: response.error };
  }
  return { data: response.data?.data };
};

export const deleteUnitConversion = async (id: string): Promise<{ error?: string }> => {
  const response = await apiDelete<{ success: boolean }>(`/unit-conversions/${id}`);
  if (response.error) {
    return { error: response.error };
  }
  return {};
};
