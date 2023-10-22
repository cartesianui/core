///<reference path="../../../../../../node_modules/@cartesianui/js/cartesian.d.ts"/>

import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class UtilsService {
  getCookieValue(key: string): string {
    return cartesian.utils.getCookieValue(key);
  }

  setCookieValue(key: string, value: string, expireDate?: Date, path?: string): void {
    cartesian.utils.setCookieValue(key, value, expireDate, path);
  }

  deleteCookie(key: string, path?: string): void {
    cartesian.utils.deleteCookie(key, path);
  }
}
