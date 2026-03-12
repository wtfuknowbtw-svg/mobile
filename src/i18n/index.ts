import { I18n } from 'i18n-js';

// Import JSON files dynamically to avoid TypeScript issues
const en = require('./en.json');
const hi = require('./hi.json');

const i18n = new I18n({ en, hi });

i18n.defaultLocale = 'hi';
i18n.locale = 'hi';
i18n.enableFallback = true;

export default i18n;
