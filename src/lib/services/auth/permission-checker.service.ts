///<reference path="../../../../../../node_modules/@cartesianui/js-axis/axis.d.ts"/>

import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PermissionCheckerService {
  isGranted(permissionName: string): boolean {
    return axis.auth.isGranted(permissionName);
  }

  isAnyGranted(permissions: string[]): boolean {
    return axis.auth.isAnyGranted(...permissions);
  }

  areAllGranted(permissions: string[]): boolean {
    return axis.auth.areAllGranted(...permissions);
  }
}
