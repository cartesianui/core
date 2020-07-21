///<reference path="../../../../../../node_modules/@orendalabs/js-axis/axis.d.ts"/>

import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class NotifyService {

    info(message: string, title?: string, options?: any): void {
        axis.notify.info(message, title, options);
    }

    success(message: string, title?: string, options?: any): void {
        axis.notify.success(message, title, options);
    }

    warn(message: string, title?: string, options?: any): void {
        axis.notify.warn(message, title, options);
    }

    error(message: string, title?: string, options?: any): void {
        axis.notify.error(message, title, options);
    }

}
