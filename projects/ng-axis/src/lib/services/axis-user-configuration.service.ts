///<reference path="../../../../../node_modules/@orendalabs/js-axis/axis.d.ts"/>

import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";

declare var jQuery: any;
declare var axis: any;

@Injectable({
  providedIn: "root",
})
export class AxisUserConfigurationService {
  constructor(private _http: HttpClient) {}

  initialize(): void {
    this._http.get("/AxisUserConfiguration/GetAll").subscribe((result) => {
      jQuery.extend(true, axis, JSON.parse(JSON.stringify(result)));
    });
  }
}
