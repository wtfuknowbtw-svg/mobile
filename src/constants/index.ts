/** ApnaKhata color tokens — derived from the design system */
export const COLORS = {
    primary: '#1A56DB',
    primaryLight: '#EBF0FB',
    success: '#057A55',
    successLight: '#ECFDF5',
    danger: '#E02424',
    dangerLight: '#FEF2F2',
    purchase: '#1A56DB',
    purchaseLight: '#EBF0FB',
    background: '#F9FAFB',
    card: '#FFFFFF',
    text: '#111928',
    textMuted: '#6B7280',
    border: '#E5E7EB',
    white: '#FFFFFF',
    black: '#000000',
    orange: '#D97706',
    orangeLight: '#FFFBEB',
} as const;

export const FONTS = {
    regular: 'System',
    medium: 'System',
    bold: 'System',
} as const;

export const API_BASE_URL = __DEV__
    // Using the dev machine's local network IP so physical device can connect
    ? 'http://10.183.238.52:3000/api'
    : 'https://apnakhata.vercel.app/api';

export const SUPPORTED_LANGUAGES = [
    { code: 'hi', label: 'हिंदी', labelEn: 'Hindi', flag: 'IN' },
    { code: 'mr', label: 'मराठी', labelEn: 'Marathi', flag: 'IN' },
    { code: 'kn', label: 'ಕನ್ನಡ', labelEn: 'Kannada', flag: 'IN' },
    { code: 'en', label: 'English', labelEn: 'English', flag: 'IN' },
    { code: 'te', label: 'తెలుగు', labelEn: 'Telugu', flag: 'IN' },
] as const;
