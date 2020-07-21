///<reference path="../../../../../../node_modules/@orendalabs/js-axis/axis.d.ts"/>

import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root'
})
export class MessageService {

    info(message: string, title?: string, options?: any): any {
        return axis.message.info(message, title, options);
    }

    success(message: string, title?: string, options?: any): any {
        return axis.message.success(message, title, options);
    }

    warn(message: string, title?: string, options?: any): any {
        return axis.message.warn(message, title, options);
    }

    error(message: string, title?: string, options?: any): any {
        return axis.message.error(message, title, options);
    }

    confirm(message: string, title?: string, callback?: (result: boolean) => void, options?: any): any {
        return axis.message.confirm(message, title, callback, options);
    }

}
