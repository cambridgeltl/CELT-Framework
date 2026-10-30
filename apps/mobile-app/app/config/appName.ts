// Display name shown on the splash, login and sign-up screens.
// Set "appName" in app-config.json (the same file the Android build workflow reads).
import appConfig from '../../app-config.json';

export const APP_NAME: string = appConfig.appName?.trim() || 'Language Learning';
