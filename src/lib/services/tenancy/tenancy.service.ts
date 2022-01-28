///<reference path="../../../../../../node_modules/@cartesianui/js-axis/axis.d.ts"/>

import { Injectable } from "@angular/core";

@Injectable({
  providedIn: "root",
})
export class TenancyService {
  get isEnabled(): boolean {
    return axis.tenancy.isEnabled;
  }

  getTenantId(): string {
    return axis.tenancy.getTenantIdCookie();
  }

  setTenantId(tenantId) {
    axis.tenancy.setTenantIdCookie(tenantId);
  }
}
