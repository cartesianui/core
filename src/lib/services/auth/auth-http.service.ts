import { Injectable } from '@angular/core';
import { HttpClient, HttpContext } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { AppConfig } from '../../app-config';
import { SKIP_AUTH_REFRESH } from '../../async/http/http-context-tokens';

/**
 * `POST {remoteServiceBaseUrl}/logout` (`RevokeTokenController`, BE) —
 * revokes the current access token, revokes the refresh token row tied to
 * it, and clears the HttpOnly `refreshToken` cookie via `Cookie::forget()`.
 *
 * This is NOT optional cleanup: `refreshToken` is a separate, HttpOnly
 * cookie from the JS-visible `Cartesian.AuthRefreshToken` one — client code
 * can never read or delete it directly. Without this call,
 * `CartesianHttpInterceptor` (see `HttpRefreshTokenService`) silently mints
 * a brand-new access token off that cookie on the very next 401, undoing a
 * "logout" that only cleared local storage. `SKIP_AUTH_REFRESH` on the
 * request itself, same as the refresh call, so a 401 here doesn't trigger
 * that same interceptor recursively.
 */
@Injectable({ providedIn: 'root' })
export class AuthHttpService {
  constructor(private http: HttpClient) {}

  logout(): Observable<void> {
    return this.http.post(`${AppConfig.remoteServiceBaseUrl}/logout`, {}, {
      context: new HttpContext().set(SKIP_AUTH_REFRESH, true),
    }).pipe(
      map(() => undefined),
      // Best-effort — a network error or already-revoked token shouldn't
      // block the user from finishing local logout.
      catchError(() => of(undefined)),
    );
  }
}
