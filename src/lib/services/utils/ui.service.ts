///<reference path="../../../../../../node_modules/@cartesianui/js/cartesian.d.ts"/>
import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class UiService {
  setBusy(key?: any, text?: string, delay?: any): void {
    return cartesian.ui.setBusy(key, text, delay);
  }

  clearBusy(key?: any, delay?: any): void {
    return cartesian.ui.clearBusy(key, delay);
  }
}
