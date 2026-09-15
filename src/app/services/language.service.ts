import { Injectable, effect, inject, signal } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

export type AppLang = 'fr' | 'en';

const STORAGE_KEY = 'chrono-lang';
const SUPPORTED_LANGS: AppLang[] = ['fr', 'en'];
const DEFAULT_LANG: AppLang = 'fr';

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private readonly translate = inject(TranslateService);

  readonly currentLang = signal<AppLang>(this.readInitialLang());

  constructor() {
    this.translate.addLangs(SUPPORTED_LANGS);
    this.translate.setFallbackLang(DEFAULT_LANG);

    effect(() => {
      const lang = this.currentLang();
      this.translate.use(lang);

      if (typeof document !== 'undefined') {
        document.documentElement.lang = lang;
      }

      try {
        window.localStorage.setItem(STORAGE_KEY, lang);
      } catch {
       
      }
    });
  }

  toggleLang(): void {
    this.currentLang.update((current) => (current === 'fr' ? 'en' : 'fr'));
  }

  setLang(lang: AppLang): void {
    this.currentLang.set(lang);
  }

  isFrench(): boolean {
    return this.currentLang() === 'fr';
  }

  private readInitialLang(): AppLang {
    if (typeof window === 'undefined') {
      return DEFAULT_LANG;
    }

    const saved = window.localStorage.getItem(STORAGE_KEY);
    return saved === 'en' ? 'en' : DEFAULT_LANG;
  }
}