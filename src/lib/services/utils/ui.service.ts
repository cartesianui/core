
import { Injectable } from '@angular/core';

/**
 * Loader configuration shape mirrors `cartesian.ui.config.loader` in
 * `@cartesianui/js`. Pass any subset to `configure()` — unspecified keys
 * keep their current value.
 */
export interface UiLoaderOptions {
  /** 'css' (built-in spinner), 'image' (custom asset), or 'icon' (icon-font class). */
  type?: 'css' | 'image' | 'icon';
  /** Built-ins: `loader-spin` / `loader-dots` / `loader-pulse` / `loader-bar`. */
  cssClass?: string;
  /** URL for type='image'. */
  image?: string | null;
  /** Icon-font class string for type='icon' (e.g. `'fa-solid fa-circle-notch fa-spin fa-3x'`). */
  icon?: string | null;
  /** Text shown beneath the spinner. */
  text?: string;
  /** Show/hide the text. */
  showText?: boolean;
  /** Backdrop style. */
  backdrop?: 'blur' | 'opacity' | 'none';
  /** Backdrop color (CSS color string). */
  backdropColor?: string;
}

export interface UiConfigureOptions {
  loader?: UiLoaderOptions;
}

@Injectable({
  providedIn: 'root'
})
export class UiService {
  /**
   * Configure the global UI loader. Call before the first `setBusy()`.
   * Typical home: app initializer.
   */
  configure(options: UiConfigureOptions): void {
    cartesian.ui.configure(options);
  }

  setBusy(key?: any, text?: string, delay?: any): void {
    return cartesian.ui.setBusy(key, text, delay);
  }

  clearBusy(key?: any, delay?: any): void {
    return cartesian.ui.clearBusy(key, delay);
  }
}
