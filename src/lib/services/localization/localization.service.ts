///<reference path="../../../../../../node_modules/@cartesianui/js/cartesian.d.ts"/>

import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LocalizationService {
  get languages(): cartesian.localization.ILanguageInfo[] {
    return cartesian.localization.languages;
  }

  get currentLanguage(): cartesian.localization.ILanguageInfo {
    return cartesian.localization.currentLanguage;
  }

  localize(key: string, sourceName: string): string {
    return cartesian.localization.localize(key, sourceName);
  }

  getSource(sourceName: string): (...key: string[]) => string {
    return cartesian.localization.getSource(sourceName);
  }
}
