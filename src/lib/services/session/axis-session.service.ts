///<reference path="../../../../../../node_modules/@orendalabs/js-axis/axis.d.ts"/>

import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class AxisSessionService {

    get userId(): number | undefined {
        return axis.session.userId;
    }

    get tenantId(): number | undefined {
        return axis.session.tenantId;
    }

    get impersonatorUserId(): number | undefined {
        return axis.session.impersonatorUserId;
    }

    get impersonatorTenantId(): number | undefined {
        return axis.session.impersonatorTenantId;
    }

    get multiTenancySide(): axis.multiTenancy.sides {
        return axis.session.multiTenancySide;
    }

}
