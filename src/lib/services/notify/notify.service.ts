///<reference path="../../../../../../node_modules/@cartesianui/js/cartesian.d.ts"/>
import { Injectable, Injector } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class NotifyService {
  private _toasterNotificationService = null;

  constructor(private _injector: Injector) {
    this._toasterNotificationService = cartesian.notify;
  }

  info(message: string, title?: string, options?: any): void {
    this._toasterNotificationService.info(message, title, options);
  }

  success(message: string, title?: string, options?: any): void {
    this._toasterNotificationService.success(message, title, options);
  }

  warn(message: string, title?: string, options?: any): void {
    this._toasterNotificationService.warn(message, title, options);
  }

  error(message: string, title?: string, options?: any): void {
    this._toasterNotificationService.error(message, title, options);
  }
}
