///<reference path="../../../../../../node_modules/@cartesianui/js/axis.d.ts"/>

import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class UtilsService {
  getCookieValue(key: string): string {
    return axis.utils.getCookieValue(key);
  }

  setCookieValue(key: string, value: string, expireDate?: Date, path?: string): void {
    axis.utils.setCookieValue(key, value, expireDate, path);
  }

  deleteCookie(key: string, path?: string): void {
    axis.utils.deleteCookie(key, path);
  }
}
