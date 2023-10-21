///<reference path="../../../../../../node_modules/@cartesianui/js/cartesian.d.ts"/>

import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class TenancyService {
  get isEnabled(): boolean {
    return cartesian.tenancy.isEnabled;
  }

  getTenantId(): string {
    return cartesian.tenancy.getTenantIdCookie();
  }

  setTenantId(tenantId) {
    cartesian.tenancy.setTenantIdCookie(tenantId);
  }
}
