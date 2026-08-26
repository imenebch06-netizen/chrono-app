import { Injectable, effect, signal } from '@angular/core';

export type ThemeMode = 'light' | 'dark';

const STORAGE_KEY = 'chrono-theme';
const PALETTE_CLASS = 'blue_theme'; // color palette class, always present — untouched by the toggle

/**
 * Handles the light/dark theme toggle for the whole application.
 *
 * The existing SCSS architecture (src/assets/scss/theme-variables and
 * src/assets/scss/themecolors) already scopes every CSS custom property
 * under ".light-theme" / ".dark-theme" / ".blue_theme" selectors — some of
 * them expect the class directly on <html>, others expect it on any
 * descendant of <html>. To satisfy both without touching that SCSS, this
 * service applies the classes to BOTH document.documentElement and
 * document.body. Since document.body is an ancestor of Angular Material's
 * CDK overlay container (dialogs, menus, tooltips, autocomplete panels all
 * get appended there), putting the classes there too means overlay content
 * inherits the same CSS variables as the rest of the app.
 */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  readonly theme = signal<ThemeMode>(this.readInitialTheme());

  constructor() {
    effect(() => this.applyTheme(this.theme()));
  }

  toggleTheme(): void {
    this.theme.update((current) => (current === 'dark' ? 'light' : 'dark'));
  }

  setTheme(mode: ThemeMode): void {
    this.theme.set(mode);
  }

  isDark(): boolean {
    return this.theme() === 'dark';
  }

  private readInitialTheme(): ThemeMode {
    if (typeof window === 'undefined') {
      return 'light';
    }

    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved === 'light' || saved === 'dark') {
      return saved;
    }

    const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches;
    return prefersDark ? 'dark' : 'light';
  }

  private applyTheme(mode: ThemeMode): void {
    if (typeof document === 'undefined') {
      return;
    }

    for (const el of [document.documentElement, document.body]) {
      el.classList.remove('light-theme', 'dark-theme');
      el.classList.add(mode === 'dark' ? 'dark-theme' : 'light-theme');
      el.classList.add(PALETTE_CLASS);
    }

    try {
      window.localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      // localStorage can throw in private-browsing/quota-exceeded edge cases — theme still applies for this session
    }
  }
}