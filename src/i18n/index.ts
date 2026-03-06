import { I18n } from 'i18n-js';
import en from './en.json';
import hi from './hi.json';

const i18n = new I18n({ en, hi });

i18n.defaultLocale = 'hi';
i18n.locale = 'hi';
i18n.enableFallback = true;

export default i18n;
