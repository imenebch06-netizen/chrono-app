import { Injectable, effect, signal, inject } from '@angular/core';
import { OverlayContainer } from '@angular/cdk/overlay';

export type ThemeMode = 'light' | 'dark';

const STORAGE_KEY = 'chrono-theme';
const PALETTE_CLASS = 'blue_theme';


@Injectable({ providedIn: 'root' })
export class ThemeService {
  private overlayContainer = inject(OverlayContainer);
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

    return window.matchMedia?.('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  private applyTheme(mode: ThemeMode): void {
    if (typeof document === 'undefined') {
      return;
    }

    const newThemeClass = mode === 'dark' ? 'dark-theme' : 'light-theme';
    const oldThemeClass = mode === 'dark' ? 'light-theme' : 'dark-theme';

   
    for (const el of [document.documentElement, document.body]) {
      el.classList.remove(oldThemeClass);
      el.classList.add(newThemeClass, PALETTE_CLASS);
    }

   
    const overlayElement = this.overlayContainer.getContainerElement();
    overlayElement.classList.remove(oldThemeClass);
    overlayElement.classList.add(newThemeClass, PALETTE_CLASS);

    try {
      window.localStorage.setItem(STORAGE_KEY, mode);
    } catch {
      
    }
  }
}