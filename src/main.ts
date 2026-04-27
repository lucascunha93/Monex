import { LOCALE_ID } from '@angular/core';
import { registerLocaleData } from '@angular/common';
import localePt from '@angular/common/locales/pt';
import localeEn from '@angular/common/locales/en';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideAnimations } from '@angular/platform-browser/animations';
import { RouteReuseStrategy, provideRouter, withPreloading, PreloadAllModules } from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';
import { providePrimeNG } from 'primeng/config';
import Aura from '@primeuix/themes/aura';

import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';

let savedLocale = 'pt-BR';
let savedDarkMode = false;
try {
  const stored = localStorage.getItem('monex_settings');
  if (stored) {
    const parsed = JSON.parse(stored);
    if (parsed.locale) savedLocale = parsed.locale;
    if (parsed.darkMode) savedDarkMode = parsed.darkMode;
  }
} catch {}

if (savedDarkMode) {
  document.body.classList.add('dark-mode');
}

registerLocaleData(localePt);
registerLocaleData(localeEn);

bootstrapApplication(AppComponent, {
  providers: [
    provideAnimations(),
    providePrimeNG({ theme: { preset: Aura, options: { darkModeSelector: '.dark-mode', cssLayer: false } } }),
    { provide: LOCALE_ID, useValue: savedLocale },
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular(),
    provideRouter(routes, withPreloading(PreloadAllModules)),
  ],
});