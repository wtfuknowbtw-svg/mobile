/** ApnaKhata color tokens — derived from the design system */
export const COLORS = {
    primary: '#1A3C6E', // Deep Blue
    primaryLight: '#F0F4F8',
    secondary: '#F5A623', // Gold/Saffron
    secondaryLight: '#FFF8E1',
    success: '#2ECC71', // Green
    successLight: '#E8F8EF',
    danger: '#E74C3C',
    dangerLight: '#FDEDEC',
    warning: '#F39C12',
    warningLight: '#FEF5E7',
    purchase: '#1A3C6E',
    purchaseLight: '#F0F4F8',
    background: '#F8F9FA',
    card: '#FFFFFF',
    text: '#1A1A1A',
    textMuted: '#7F8C8D',
    border: '#E0E0E0',
    white: '#FFFFFF',
    black: '#000000',
    orange: '#F5A623',
    orangeLight: '#FFF8E1',
    gold: '#F5A623',
    goldLight: '#FFF8E1',
} as const;

export const FONTS = {
    regular: 'System',
    medium: 'System',
    bold: 'System',
} as const;

export const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'https://apnabackend-theta.vercel.app/api';

export const SUPPORTED_LANGUAGES = [
    { code: 'hi', label: 'हिंदी', labelEn: 'Hindi', flag: 'IN' },
    { code: 'mr', label: 'मराठी', labelEn: 'Marathi', flag: 'IN' },
    { code: 'kn', label: 'ಕನ್ನಡ', labelEn: 'Kannada', flag: 'IN' },
    { code: 'en', label: 'English', labelEn: 'English', flag: 'IN' },
    { code: 'te', label: 'తెలుగు', labelEn: 'Telugu', flag: 'IN' },
] as const;
