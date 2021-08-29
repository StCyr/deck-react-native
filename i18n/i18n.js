import * as Localization from 'expo-localization';
import i18n from 'i18n-js';
import { en, fr } from './languages';

i18n.fallbacks = true;
i18n.defaultLocale = 'en';
i18n.translations = { en, fr };
i18n.locale = Localization.locale;

export {i18n};