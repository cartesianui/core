///<reference path="../../../../../../node_modules/@cartesianui/js/cartesian.d.ts"/>

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { TokenService } from '../auth/token.service';
import { convertObjectKeysToCamel } from '../utils/helpers';
import { AppConstants } from '../../app-constants';

type IAuthUser = {
  [key: string]: string;
  name?: string | undefined;
  username?: string | undefined;
  email?: string | undefined;
};

@Injectable({
  providedIn: 'root'
})
export class SessionService {
  private _session = null;
  private _user: IAuthUser;

  constructor(
    private tokenService: TokenService,
    private httpClient: HttpClient
  ) {
    this._session = cartesian.session;
  }

  init(): Promise<any> {
    const token = this.tokenService.getToken();

    const requestHeaders = {};

    if (token) {
      requestHeaders['Authorization'] = `Bearer ${token}`;
    }

    return new Promise<IAuthUser | boolean>((resolve) => {
      this.httpClient.get<any>(AppConstants.remoteServiceBaseUrl + AppConstants.apiEndpoints.authenticatedUser, { headers: requestHeaders }).subscribe({
        next: (result: any) => {
          this._user = convertObjectKeysToCamel(result.data) as IAuthUser;
          resolve(this._user);
        },
        error: (error) => {
          resolve(false);
        }
      });
    });
  }

  get user(): IAuthUser {
    return this._user;
  }

  get userId(): string {
    return this.user ? this.user.id : null;
  }

  getShownLoginName(): string {
    return this._user.name ?? this._user.email;
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
