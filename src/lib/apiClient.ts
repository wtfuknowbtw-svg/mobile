import { API_BASE_URL } from '../constants';
import { useAppStore } from '../store/useAppStore';

/**
 * Get the JWT token from the store
 */
function getToken(): string | null {
    return useAppStore.getState().token;
}

/**
 * Make an authenticated API request to the backend
 */
export async function apiRequest<T = any>(
    endpoint: string,
    options: RequestInit = {}
): Promise<{ data?: T; error?: string }> {
    const token = getToken();
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
    
    console.log('API Request - Endpoint:', endpoint);
    console.log('API Request - Full URL:', url);
    console.log('API Request - API_BASE_URL:', API_BASE_URL);
    console.log('API Request - Token:', token ? 'Bearer ' + token.substring(0, 20) + '...' : 'NO TOKEN');

    const headers: HeadersInit = {
        'Content-Type': 'application/json',
        ...options.headers,
    };

    // Add JWT token if available
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
        console.log('API Request - Authorization Header:', `Bearer ${token.substring(0, 20)}...`);
    } else {
        console.warn('API Request - No token available for protected endpoint');
    }

    try {
        const response = await fetch(url, {
            ...options,
            headers,
        });

        const data = await response.json();

        if (!response.ok) {
            return {
                error: data.error || `Request failed with status ${response.status}`,
            };
        }

        return { data };
    } catch (error: any) {
        console.error('API Request Error:', error);
        return {
            error: error.message || 'Network error. Please check your connection.',
        };
    }
}

/**
 * GET request helper
 */
export async function apiGet<T = any>(endpoint: string): Promise<{ data?: T; error?: string }> {
    return apiRequest<T>(endpoint, { method: 'GET' });
}

/**
 * POST request helper
 */
export async function apiPost<T = any>(
    endpoint: string,
    body: any
): Promise<{ data?: T; error?: string }> {
    return apiRequest<T>(endpoint, {
        method: 'POST',
        body: JSON.stringify(body),
    });
}

/**
 * PUT request helper
 */
export async function apiPut<T = any>(
    endpoint: string,
    body: any
): Promise<{ data?: T; error?: string }> {
    return apiRequest<T>(endpoint, {
        method: 'PUT',
        body: JSON.stringify(body),
    });
}

/**
 * DELETE request helper
 */
export async function apiDelete<T = any>(endpoint: string): Promise<{ data?: T; error?: string }> {
    return apiRequest<T>(endpoint, { method: 'DELETE' });
}
