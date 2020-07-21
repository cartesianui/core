///<reference path="../../../../../../node_modules/@cartesian-ui/js-axis/axis.d.ts"/>

import { Injectable } from "@angular/core";

@Injectable({
  providedIn: "root",
})
export class LogService {
  debug(logObject?: any): void {
    axis.log.debug(logObject);
  }

  info(logObject?: any): void {
    axis.log.info(logObject);
  }

  warn(logObject?: any): void {
    axis.log.warn(logObject);
  }

  error(logObject?: any): void {
    axis.log.error(logObject);
  }

  fatal(logObject?: any): void {
    axis.log.fatal(logObject);
  }
}
