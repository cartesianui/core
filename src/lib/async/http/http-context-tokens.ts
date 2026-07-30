import { HttpContextToken } from '@angular/common/http';

/**
 * Marks a request as the token-refresh call itself, so a 401 on THIS
 * request doesn't recurse back into CartesianHttpInterceptor's refresh
 * flow. Without this, a refresh call that itself comes back 401 (a dead
 * refresh-token cookie, e.g. after a backend reset) re-enters
 * tryAuthWithRefreshToken() while `isRefreshing` is still true, parking on
 * `refreshTokenSubject` for a value that only the very call it's blocking
 * on would ever produce — a permanent deadlock that hangs app bootstrap
 * with no error and no redirect to login.
 */
export const SKIP_AUTH_REFRESH = new HttpContextToken<boolean>(() => false);
