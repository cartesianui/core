///<reference path="../../../../../../node_modules/@cartesianui/js/cartesian.d.ts"/>

import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class MessageService {
  info(message: string, title?: string, options?: any): any {
    return cartesian.message.info(message, title, options);
  }

  success(message: string, title?: string, options?: any): any {
    return cartesian.message.success(message, title, options);
  }

  warn(message: string, title?: string, options?: any): any {
    return cartesian.message.warn(message, title, options);
  }

  error(message: string, title?: string, options?: any): any {
    return cartesian.message.error(message, title, options);
  }

  confirm(message: string, title?: string, callback?: (result: boolean) => void, options?: any): any {
    return cartesian.message.confirm(message, title, callback, options);
  }
}
