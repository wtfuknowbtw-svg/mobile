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

        const resultData = response.data?.data || response.data as Partial<Transaction>[];
        console.log('📊 Final OCR Result Data:', resultData);
        console.log('📊 Result Data Length:', resultData?.length);
        
        if (resultData && resultData.length > 0) {
            console.log('📊 First Transaction:', resultData[0]);
            console.log('📊 Transaction Fields:', Object.keys(resultData[0] || {}));
        }

        return { data: resultData };
    } catch (error) {
        console.error('Backend OCR error:', error);
        return { error: error instanceof Error ? error.message : 'Failed to process OCR' };
    }
};

/**
 * Simple text parser that extracts transaction data from Hindi/English text.
 * Handles patterns like:
 * - "Raja ko 2 kg daal diya 200 rupay mein"
 * - "Priya se 500 rupay liye"
 * - "Customer name - item - amount"
 */
function parseTransactionText(text: string): Partial<Transaction> | null {
    if (!text) return null;

    const lower = text.toLowerCase();

    // Extract price - look for numbers near "rupay", "rs", "₹", or standalone large numbers
    let price = 0;
    const pricePatterns = [
        /(\d+)\s*(?:rupay|rupee|rupees|rs|₹)/i,
        /(?:rupay|rupee|rupees|rs|₹)\s*(\d+)/i,
        /(\d{2,})\s*(?:mein|me|ka|ki|ke)/i,
        /(\d+)\/-/,
    ];
    for (const pattern of pricePatterns) {
        const match = text.match(pattern);
        if (match) {
            price = parseInt(match[1], 10);
            break;
        }
    }

    // If no price found, look for any number > 10
    if (price === 0) {
        const numbers = text.match(/\d+/g);
        if (numbers) {
            const bigNumbers = numbers.map(Number).filter((n) => n > 10);
            if (bigNumbers.length > 0) {
                price = Math.max(...bigNumbers);
            }
        }
    }

    // Extract customer name - usually the first word/name
    let customerName = 'Unknown';
    const nameMatch = text.match(/^(\w+)/);
    if (nameMatch) {
        customerName = nameMatch[1].charAt(0).toUpperCase() + nameMatch[1].slice(1);
    }

    // Extract quantity and item
    let itemName = 'Items';
    let quantity: number | undefined;
    let unit: string | undefined;

    const qtyMatch = text.match(/(\d+)\s*(kg|g|liter|litre|l|packet|pkt|dozen|pc|piece)/i);
    if (qtyMatch) {
        quantity = parseInt(qtyMatch[1], 10);
        unit = qtyMatch[2];

        // Try to get item name near the quantity
        const itemMatch = text.match(
            new RegExp(`\\d+\\s*(?:kg|g|liter|litre|l|packet|pkt|dozen|pc|piece)\\s+(\\w+)`, 'i')
        );
        if (itemMatch) {
            itemName = itemMatch[1].charAt(0).toUpperCase() + itemMatch[1].slice(1);
        }
    }

    // Determine transaction type
    let type: 'cash' | 'credit' | 'expense' = 'cash';
    if (lower.includes('udhar') || lower.includes('credit') || lower.includes('udhaar') || lower.includes('baaki')) {
        type = 'credit';
    } else if (lower.includes('khareed') || lower.includes('purchase') || lower.includes('bought')) {
        type = 'expense';
    }

    return {
        customerName,
        itemName: quantity ? `${quantity}${unit ? unit : ''} ${itemName}` : itemName,
        quantity,
        unit,
        price: price || 100,
        type,
        date: new Date().toISOString(),
        sourceType: 'voice',
        aiConfidence: 75,
        isConfirmed: false,
    };
}
