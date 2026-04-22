import { COLORS } from '../constants';

/**
 * Get a consistent background color for a name's initial
 */
export const getInitialColor = (name: string): string => {
    if (!name) return COLORS.primary;
    
    const colors = [
        '#FF6B6B', // Red
        '#4ECDC4', // Teal
        '#45B7D1', // Blue
        '#96CEB4', // Green
        '#FF9F43', // Orange
        '#7C3AED', // Purple
        '#F368E0', // Pink
        '#0ABDE3', // Cyan
        '#EE5253', // Soft Red
        '#10AC84', // Dark Green
        '#222F3E', // Navy
    ];
    
    // Use character code of first letter to pick a color
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
};
