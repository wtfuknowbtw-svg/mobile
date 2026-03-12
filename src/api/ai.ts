import { apiPost } from '../lib/apiClient';
import type { Transaction } from '../types';

export const processOCR = async (
    payload: { imageUrl?: string; base64Image?: string; transcript?: string }
): Promise<{ data?: Partial<Transaction>[]; error?: string }> => {
    try {
        console.log('🔍 OCR Request Payload:', payload);
        const response = await apiPost<{ data: Partial<Transaction>[] }>('/ai/ocr', payload);
        
        console.log('📥 OCR Raw Response:', response);
        console.log('📥 OCR Response Data:', response.data);
        console.log('📥 OCR Response Error:', response.error);
        
        if (response.error) {
            console.error('Backend OCR failed:', response.error);
            return { error: response.error };
        }

        const resultData = response.data?.data || (response.data as unknown) as Partial<Transaction>[];
        console.log('📊 Final OCR Result Data:', resultData);
        console.log('📊 Result Data Length:', resultData?.length);
        
        if (resultData && resultData.length > 0) {
            console.log('📊 First Transaction:', resultData[0]);
            console.log('📊 Transaction Fields:', Object.keys(resultData[0] || {}));
        }

        return { data: resultData };
    } catch (error) {
        console.error('OCR API error:', error);
        return { error: error instanceof Error ? error.message : 'OCR processing failed' };
    }
};

export const processVoice = async (
    payload: { transcript: string }
): Promise<{ data?: Partial<Transaction>[]; error?: string }> => {
    try {
        console.log('🎤 Voice Request Payload:', { 
            transcript: payload.transcript 
        });
        
        const response = await apiPost<{ data: Partial<Transaction>[] }>('/ai/voice', payload);
        
        console.log('📥 Voice Raw Response:', response);
        console.log('📥 Voice Response Data:', response.data);
        console.log('📥 Voice Response Error:', response.error);
        
        if (response.error) {
            console.error('Backend voice failed:', response.error);
            return { error: response.error };
        }

        const resultData = response.data?.data || (response.data as unknown) as Partial<Transaction>[];
        console.log('📊 Final Voice Result Data:', resultData);
        console.log('📊 Result Data Length:', resultData?.length);
        
        if (resultData && resultData.length > 0) {
            console.log('📊 First Transaction:', resultData[0]);
            console.log('📊 Transaction Fields:', Object.keys(resultData[0] || {}));
        }

        return { data: resultData };
    } catch (error) {
        console.error('Voice API error:', error);
        return { error: error instanceof Error ? error.message : 'Voice processing failed' };
    }
};
