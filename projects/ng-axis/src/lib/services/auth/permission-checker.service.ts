///<reference path="../../../../../../node_modules/@orendalabs/js-axis/axis.d.ts"/>

import { Injectable } from "@angular/core";

@Injectable({
  providedIn: "root",
})
export class PermissionCheckerService {
  isGranted(permissionName: string): boolean {
    return axis.auth.isGranted(permissionName);
  }
}
