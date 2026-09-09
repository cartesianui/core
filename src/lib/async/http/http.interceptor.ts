import { Injectable, Injector } from '@angular/core';
import { HttpInterceptor, HttpHandler, HttpRequest, HttpEvent, HttpResponse, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, of, BehaviorSubject, throwError } from 'rxjs';
import { switchMap, filter, take, catchError, map } from 'rxjs/operators';
import { AppConfig } from '../../app-config';
import { TokenService, RefreshTokenService, UtilsService } from '../../services';
import { HttpResponseService } from './http-response.service';
import { HTTP_HEADER_CONTRIBUTORS } from './header-contributor';
import { SKIP_AUTH_REFRESH } from './http-context-tokens';

declare const cartesian: any;

@Injectable()
export class CartesianHttpInterceptor implements HttpInterceptor {
  private _httpResponseService: HttpResponseService;
  private _tokenService: TokenService = new TokenService();
  private _utilsService: UtilsService = new UtilsService();

  constructor(responseService: HttpResponseService, private _injector: Injector) {
    this._httpResponseService = responseService;
  }

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    var modifiedRequest = this.normalizeRequestHeaders(request);
    return next.handle(modifiedRequest).pipe(
      catchError((error) => {
        if (error instanceof HttpErrorResponse) {
          // A 401 on the refresh call itself must never re-enter the
          // refresh flow — see SKIP_AUTH_REFRESH doc comment.
          if (error.status === 401 && !request.context.get(SKIP_AUTH_REFRESH)) {
            return this.tryAuthWithRefreshToken(request, next, error);
          } else {
            return this.handleErrorResponse(error);
          }
        }
      }),
      switchMap((event) => {
        return this.handleSuccessResponse(event);
      })
    );
  }

  protected tryGetRefreshTokenService(): Observable<boolean> {
    var _refreshTokenService = this._injector.get(RefreshTokenService, null);

    if (_refreshTokenService) {
      return _refreshTokenService.tryAuthWithRefreshToken();
    }
    return of(false);
  }

  private isRefreshing = false;
  private refreshTokenSubject: BehaviorSubject<any> = new BehaviorSubject<any>(null);

  private tryAuthWithRefreshToken(request: HttpRequest<any>, next: HttpHandler, error: any) {
    if (!this.isRefreshing) {
      this.isRefreshing = true;
      this.refreshTokenSubject.next(null);

      return this.tryGetRefreshTokenService().pipe(
        switchMap((authResult: boolean) => {
          this.isRefreshing = false;
          if (authResult) {
            this.refreshTokenSubject.next(authResult);
            let modifiedRequest = this.normalizeRequestHeaders(request);
            return next.handle(modifiedRequest);
          } else {
            // Wake up any requests parked below waiting on this same
            // refresh attempt — otherwise they hang forever (filter()
            // there only lets non-null values through, and this was the
            // only place that could ever push one).
            this.refreshTokenSubject.next(false);
            // Definitively unauthenticated — both the access token and the
            // refresh token are dead. Clear them so the next page load
            // doesn't resend the same doomed token and repeat this whole
            // cycle (extra error toast + redundant redirect attempt) on
            // every subsequent reload.
            this._tokenService.clearToken();
            this._tokenService.clearRefreshToken();
            return this.handleErrorResponse(error);
          }
        })
      );
    } else {
      return this.refreshTokenSubject.pipe(
        filter((authResult) => authResult != null),
        take(1),
        switchMap((authResult) => {
          if (!authResult) {
            return this.handleErrorResponse(error);
          }
          let modifiedRequest = this.normalizeRequestHeaders(request);
          return next.handle(modifiedRequest);
        })
      );
    }
  }

  protected normalizeRequestHeaders(request: HttpRequest<any>): HttpRequest<any> {
    var modifiedHeaders = new HttpHeaders();
    modifiedHeaders = request.headers.set('Pragma', 'no-cache').set('Cache-Control', 'no-cache').set('Expires', 'Sat, 01 Jan 2000 00:00:00 GMT');

    modifiedHeaders = this.addXRequestedWithHeader(modifiedHeaders);
    modifiedHeaders = this.addAuthorizationHeaders(modifiedHeaders);
    modifiedHeaders = this.addAcceptLanguageHeader(modifiedHeaders);
    modifiedHeaders = this.addTenantIdHeader(modifiedHeaders);
    modifiedHeaders = this.addTenantHostHeader(modifiedHeaders);
    modifiedHeaders = this.addContributedHeaders(modifiedHeaders);
    modifiedHeaders = this.addCustomHeaders(modifiedHeaders);

    return request.clone({
      headers: modifiedHeaders
    });
  }

  protected addXRequestedWithHeader(headers: HttpHeaders): HttpHeaders {
    if (headers) {
      headers = headers.set('X-Requested-With', 'XMLHttpRequest');
    }

    return headers;
  }

  protected addAcceptLanguageHeader(headers: HttpHeaders): HttpHeaders {
    let cookieLangValue = this._utilsService.getCookieValue('Cartesian.Localization.CultureName');
    if (cookieLangValue && headers && !headers.has('Accept-Language')) {
      headers = headers.set('Accept-Language', cookieLangValue);
    }

    return headers;
  }

  protected addTenantIdHeader(headers: HttpHeaders): HttpHeaders {
    let cookieTenantIdValue = this._utilsService.getCookieValue(cartesian.tenancy.tenantIdCookieName);
    if (cookieTenantIdValue && headers && !headers.has(cartesian.tenancy.tenantIdCookieName)) {
      headers = headers.set(cartesian.tenancy.tenantIdCookieName, cookieTenantIdValue);
    }

    return headers;
  }

  protected addTenantHostHeader(headers: HttpHeaders): HttpHeaders {
    // Header name from AppConfig (BE single source via the emitted cartesian
    // global), not a hardcoded literal.
    let headerAttribute = AppConfig.tenantHeaderAttribute;
    let tenancyConfiguration = AppConfig.interceptor.tenancy;

    if (headerAttribute && headers && !headers.has(headerAttribute)) {
      if (tenancyConfiguration !== undefined && tenancyConfiguration.overwriteHeaderAttribute) {
        headers = headers.set(headerAttribute, tenancyConfiguration.host);
      } else {
        headers = headers.set(headerAttribute, this.getHostName());
      }
    }

    return headers;
  }

  /**
   * Merge headers from any registered HTTP_HEADER_CONTRIBUTORS. Feature libs
   * register contributors to attach their own headers without the platform
   * interceptor carrying any domain knowledge. Read lazily via the injector so
   * apps that register no contributors are unaffected. Null/empty values are
   * skipped and an already-present header is never overwritten.
   */
  protected addContributedHeaders(headers: HttpHeaders): HttpHeaders {
    const contributors = this._injector.get(HTTP_HEADER_CONTRIBUTORS, null);
    if (!contributors || !headers) {
      return headers;
    }
    for (const contributor of contributors) {
      const contributed = contributor?.headers?.() ?? {};
      for (const key of Object.keys(contributed)) {
        const value = contributed[key];
        if (key && value && !headers.has(key)) {
          headers = headers.set(key, value);
        }
      }
    }

    return headers;
  }

  protected addCustomHeaders(headers: HttpHeaders): HttpHeaders {
    let customHeaders = AppConfig.interceptor.headers;

    if (headers) {
      if (customHeaders !== undefined) {
        Object.keys(customHeaders).forEach(function (key) {
          headers = headers.set(key, customHeaders[key]);
        });
      }
    }

    return headers;
  }

  protected addAuthorizationHeaders(headers: HttpHeaders): HttpHeaders {
    let authorizationHeaders = headers ? headers.getAll('Authorization') : null;
    if (!authorizationHeaders) {
      authorizationHeaders = [];
    }

    if (!this.itemExists(authorizationHeaders, (item: string) => item.indexOf('Bearer ') == 0)) {
      let token = this._tokenService.getToken();
      if (headers && token) {
        headers = headers.set('Authorization', 'Bearer ' + token);
      }
    }

    return headers;
  }

  protected handleSuccessResponse(event: HttpEvent<any>): Observable<HttpEvent<any>> {
    if (event instanceof HttpResponse) {
      if (event.body instanceof Blob && event.body.type && event.body.type.indexOf('application/json') >= 0) {
        return this._httpResponseService.extractContent(event.body).pipe(
          map((json) => {
            const responseBody = json == 'null' ? {} : JSON.parse(json);
            const modifiedResponse = this._httpResponseService.handleResponse(
              event.clone({
                body: responseBody
              })
            );
            return modifiedResponse.clone({
              body: new Blob([JSON.stringify(modifiedResponse.body)], {
                type: 'application/json'
              })
            });
          })
        );
      }
    }
    return of(event);
  }

  protected handleErrorResponse(response: HttpErrorResponse): Observable<any> {
    return this._httpResponseService.extractContent(response.error).pipe(
      switchMap((json) => {
        const errorBody = json == '' || json == 'null' ? {} : JSON.parse(json);
        const cloneResponse = new HttpResponse({
          headers: response.headers,
          status: response.status,
          body: errorBody
        });
        const cartesianResponse = this._httpResponseService.getCartesianResponse(cloneResponse);
        if (cartesianResponse) {
          // ── THE STATUS, STAMPED (UF-D33 option B; `F28`, dated to 9999e16, 2023-10-21).
          //
          // This throws the PARSED BODY rather than the `HttpErrorResponse`, so `err.status` and
          // `err.error` are `undefined` in every component in every app. The sentence is NOT lost —
          // `handleCartesianResponse()` lifts it out and `showError()` displays it — but with no
          // status a component cannot tell a 422 REFUSAL from a failure, and so cannot show it IN
          // PLACE beside the rows being answered. A placement defect, not a silent one.
          //
          // `__status`, NOT `status`: `__cartesian` and `__redirectUrl` already namespace this way,
          // and a response body may legitimately carry a `status` field of its own.
          //
          // PURELY ADDITIVE. The 6 call sites in `care`, `pos`, `system` and `platform/common` that
          // read the flat shape are untouched, because nothing is taken away. Rethrowing the real
          // `HttpErrorResponse` would repair 56 dead reads and break those 6 — a platform migration
          // wearing a one-line fix's clothing, and the user's call, not this workstream's.
          (cartesianResponse as any).__status = response.status;

          this._httpResponseService.handleCartesianResponse(cloneResponse, cartesianResponse);
        } else {
          this._httpResponseService.handleErrorResponse(cloneResponse);
        }

        return throwError(() => cartesianResponse ?? cloneResponse);
      })
    );
  }

  private itemExists<T>(items: T[], predicate: (item: T) => boolean): boolean {
    for (let i = 0; i < items.length; i++) {
      if (predicate(items[i])) {
        return true;
      }
    }

    return false;
  }

  private getHostName(): string {
    const port = document.location.port ? ':' + document.location.port : '';
    return document.location.hostname + port;
  }
}
