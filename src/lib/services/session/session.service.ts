///<reference path="../../../../../../node_modules/@cartesianui/js/axis.d.ts"/>

import { Injectable, Injector } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SessionService {
  private _session = null;

  constructor(private _injector: Injector) {
    this._session = axis.session;
  }

  get isHostSide(): boolean {
    return this._session.isHostSide();
  }

  get isHostAdmin(): boolean {
    return this._session.isHostAdmin();
  }

  get isTenantSide(): boolean {
    return this._session.isTenantSide();
  }

  get isTenantAdmin(): boolean {
    return this._session.isTenantAdmin();
  }

  get isUserLogged(): boolean {
    return this._session.isUserLogged();
  }
}
