///<reference path="../../../../../../node_modules/@orendalabs/js-axis/axis.d.ts"/>

import { Injectable } from "@angular/core";

@Injectable({
  providedIn: "root",
})
export class LocalizationService {
  get languages(): axis.localization.ILanguageInfo[] {
    return axis.localization.languages;
  }

  get currentLanguage(): axis.localization.ILanguageInfo {
    return axis.localization.currentLanguage;
  }

  localize(key: string, sourceName: string): string {
    return axis.localization.localize(key, sourceName);
  }

  getSource(sourceName: string): (...key: string[]) => string {
    return axis.localization.getSource(sourceName);
  }
}
