import { API_BASE_URL } from '../constants';

const BACKEND_URL = API_BASE_URL;

export const validateStoredToken = async (token: string): Promise<boolean> => {
    try {
        const response = await fetch(`${BACKEND_URL}/transactions`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
            },
        });

        // If we get a 200 response, token is valid
        // If we get 401, token is invalid/expired
        return response.ok;
    } catch (error) {
        console.error('Token validation error:', error);
        return false;
    }
};

export const clearAuthData = () => {
    // This will be handled by the store's logout function
    // which already clears the persisted data
};
