///<reference path="../../../../../../node_modules/@cartesianui/js/cartesian.d.ts"/>

import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class TokenService {
  getToken(): string {
    return cartesian.auth.getToken();
  }

  getTokenCookieName(): string {
    return cartesian.auth.tokenCookieName;
  }

  clearToken(): void {
    cartesian.auth.clearToken();
  }

  setToken(authToken: string, expireDate?: Date): void {
    cartesian.auth.setToken(authToken, expireDate);
  }

  getRefreshToken(): string {
    return cartesian.auth.getRefreshToken();
  }

  getRefreshTokenCookieName(): string {
    return cartesian.auth.refreshTokenCookieName;
  }

  clearRefreshToken(): void {
    cartesian.auth.clearRefreshToken();
  }

  setRefreshToken(refreshToken: string, expireDate?: Date): void {
    cartesian.auth.setRefreshToken(refreshToken, expireDate);
  }
}
