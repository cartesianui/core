///<reference path="../../../../../../node_modules/@cartesianui/js-axis/axis.d.ts"/>

import { Injectable } from "@angular/core";

@Injectable({
  providedIn: "root",
})
export class SettingService {
  get(name: string): string {
    return axis.setting.get(name);
  }

  getBoolean(name: string): boolean {
    return axis.setting.getBoolean(name);
  }

  getInt(name: string): number {
    return axis.setting.getInt(name);
  }
}
