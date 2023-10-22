///<reference path="../../../../../../node_modules/@cartesianui/js/cartesian.d.ts"/>

import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PermissionCheckerService {
  isGranted(permissionName: string): boolean {
    return cartesian.auth.isGranted(permissionName);
  }

  isAnyGranted(permissions: string[]): boolean {
    return cartesian.auth.isAnyGranted(...permissions);
  }

  areAllGranted(permissions: string[]): boolean {
    return cartesian.auth.areAllGranted(...permissions);
  }
}
