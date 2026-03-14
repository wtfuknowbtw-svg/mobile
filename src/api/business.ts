import { apiGet, apiPut } from '../lib/apiClient';

export interface BusinessProfile {
    id: string;
    phone: string;
    name?: string;
    ownerName?: string;
    type?: string;
    gstin?: string;
}

export const getBusinessProfile = async (): Promise<{ data?: BusinessProfile; error?: string }> => {
    const response = await apiGet<{ data: BusinessProfile }>('/business-profile');

    if (response.error) {
        return { error: response.error };
    }

    return { data: response.data?.data };
};

export const updateBusinessProfile = async (
    data: { name?: string; ownerName?: string; type?: string; gstin?: string }
): Promise<{ data?: BusinessProfile; error?: string }> => {
    const response = await apiPut<{ data: BusinessProfile; message?: string }>('/business-profile', data);

    if (response.error) {
        return { error: response.error };
    }

    return { data: response.data?.data };
};
