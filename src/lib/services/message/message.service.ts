

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

  /**
   * Show a SweetAlert confirm dialog. Pass `isHtml: true` when the message
   * contains markup (e.g. `<ul><li>…</li></ul>`) you want SweetAlert to
   * render rather than escape — the underlying `cartesian.message.confirm`
   * routes `isHtml` to SweetAlert's `html` option. Default false treats the
   * message as plain text (existing callsites unaffected).
   */
  confirm(
    message: string,
    title?: string,
    callback?: (result: boolean) => void,
    isHtml: boolean = false,
    options?: any,
  ): any {
    return cartesian.message.confirm(message, title, callback, isHtml, options);
  }
}
