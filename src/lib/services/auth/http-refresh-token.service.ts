import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AppConfig } from '../../app-config';
import { convertObjectKeysToCamel } from '../../utils';
import { RefreshTokenService } from './refresh-token.service';
import { TokenService } from './token.service';

/**
 * Default `RefreshTokenService`: calls the BE's cookie-based refresh endpoint
 * (`POST {remoteServiceBaseUrl}/clients/web/refresh` — the `refreshToken`
 * HttpOnly cookie set at login is sent automatically, same-origin, via the
 * dev-server proxy / production routing) and stores the new access token on
 * success. Registered per-app alongside `CartesianHttpInterceptor` itself,
 * which is what actually invokes this on a 401.
 */
@Injectable()
export class HttpRefreshTokenService extends RefreshTokenService {
  private static readonly REFRESH_ENDPOINT = '/clients/web/refresh';

  constructor(
    private http: HttpClient,
    private tokenService: TokenService,
  ) {
    super();
  }

  tryAuthWithRefreshToken(): Observable<boolean> {
    return this.http.post<any>(`${AppConfig.remoteServiceBaseUrl}${HttpRefreshTokenService.REFRESH_ENDPOINT}`, {}).pipe(
      map((response) => {
        const result = convertObjectKeysToCamel(response?.data ?? response);
        if (result?.accessToken) {
          this.tokenService.setToken(result.accessToken);
          return true;
        }
        return false;
      }),
      catchError(() => of(false)),
    );
  }
}
