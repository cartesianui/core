///<reference path="../../../../../../node_modules/@cartesianui/js/cartesian.d.ts"/>

import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SettingService {
  get(name: string): string {
    return cartesian.setting.get(name);
  }

  getBoolean(name: string): boolean {
    return cartesian.setting.getBoolean(name);
  }

  getInt(name: string): number {
    return cartesian.setting.getInt(name);
  }
}
