///<reference path="../../../../../../node_modules/@cartesianui/js/cartesian.d.ts"/>

import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class LogService {
  debug(logObject?: any): void {
    cartesian.log.debug(logObject);
  }

  info(logObject?: any): void {
    cartesian.log.info(logObject);
  }

  warn(logObject?: any): void {
    cartesian.log.warn(logObject);
  }

  error(logObject?: any): void {
    cartesian.log.error(logObject);
  }

  fatal(logObject?: any): void {
    cartesian.log.fatal(logObject);
  }
}
