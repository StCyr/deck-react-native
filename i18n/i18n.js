import * as Localization from 'expo-localization';
import i18n from 'i18n-js';
import { en, fr, ru, ua, ca, de, it } from './languages';

i18n.fallbacks = true;
i18n.defaultLocale = 'en';
i18n.translations = { en, fr, ru, ua, ca, de, it };
i18n.locale = Localization.locale;

export {i18n};
