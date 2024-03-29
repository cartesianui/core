import { Injectable, Injector } from '@angular/core';
import { HttpInterceptor, HttpHandler, HttpRequest, HttpEvent, HttpResponse, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { Observable, of, BehaviorSubject, throwError } from 'rxjs';
import { switchMap, filter, take, catchError, map } from 'rxjs/operators';
import { AppConstants } from '../../app-constants';
import { TokenService, RefreshTokenService, UtilsService } from '../../services';
import { HttpResponseService } from './http-response.service';

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
          if (error.status === 401) {
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
            return this.handleErrorResponse(error);
          }
        })
      );
    } else {
      return this.refreshTokenSubject.pipe(
        filter((authResult) => authResult != null),
        take(1),
        switchMap((authResult) => {
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
    let headerAttribute = cartesian.tenancy.headerAttribute;
    let tenancyConfiguration = AppConstants.interceptor.tenancy;

    if (headerAttribute && headers && !headers.has(headerAttribute)) {
      if (tenancyConfiguration !== undefined && tenancyConfiguration.overwriteHeaderAttribute) {
        headers = headers.set(headerAttribute, tenancyConfiguration.host);
      } else {
        headers = headers.set(headerAttribute, this.getHostName());
      }
    }

    return headers;
  }

  protected addCustomHeaders(headers: HttpHeaders): HttpHeaders {
    let customHeaders = AppConstants.interceptor.headers;

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
