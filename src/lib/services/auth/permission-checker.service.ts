///<reference path="../../../../../../node_modules/abp-web-resources/Abp/Framework/scripts/axis.d.ts"/>

import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class PermissionCheckerService {

    isGranted(permissionName: string): boolean {
        return axis.auth.isGranted(permissionName);
    }

}