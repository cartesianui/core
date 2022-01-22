import { Injectable, Injector } from "@angular/core";
import { Observable, of, BehaviorSubject } from "rxjs";
import { LogService } from "../services/log/log.service";
import { TokenService } from "../services/auth/token.service";
import { UtilsService } from "../services/utils/utils.service";
import { AppConstants } from "../app-constants";
import {
  HttpInterceptor,
  HttpHandler,
  HttpRequest,
  HttpEvent,
  HttpResponse,
  HttpErrorResponse,
  HttpHeaders,
} from "@angular/common/http";
import { switchMap, filter, take, catchError, tap, map } from "rxjs/operators";
import { throwError } from "rxjs";
import { AxisHttpConfigurationService } from "./axis-http-configuration.service";
import { RefreshTokenService } from "./refresh-token.service";

declare const axis: any;

@Injectable()
export class AxisHttpInterceptor implements HttpInterceptor {
  protected configuration: AxisHttpConfigurationService;
  private _tokenService: TokenService = new TokenService();
  private _utilsService: UtilsService = new UtilsService();
  private _logService: LogService = new LogService();

  constructor(
    configuration: AxisHttpConfigurationService,
    private _injector: Injector
  ) {
    this.configuration = configuration;
  }

  intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    var modifiedRequest = this.normalizeRequestHeaders(request);
    return next.handle(modifiedRequest).pipe(
      catchError((error) => {
        if (error instanceof HttpErrorResponse && error.status === 401) {
          return this.tryAuthWithRefreshToken(request, next, error);
        } else {
          return this.handleErrorResponse(error);
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
    modifiedHeaders = request.headers
      .set("Pragma", "no-cache")
      .set("Cache-Control", "no-cache")
      .set("Expires", "Sat, 01 Jan 2000 00:00:00 GMT");

    modifiedHeaders = this.addXRequestedWithHeader(modifiedHeaders);
    modifiedHeaders = this.addAuthorizationHeaders(modifiedHeaders);
    modifiedHeaders = this.addAspNetCoreCultureHeader(modifiedHeaders);
    modifiedHeaders = this.addAcceptLanguageHeader(modifiedHeaders);
    modifiedHeaders = this.addTenantIdHeader(modifiedHeaders);
    modifiedHeaders = this.addTenantHostHeader(modifiedHeaders);

    return request.clone({
      headers: modifiedHeaders,
    });
  }

  protected addXRequestedWithHeader(headers: HttpHeaders): HttpHeaders {
    if (headers) {
      headers = headers.set("X-Requested-With", "XMLHttpRequest");
    }

    return headers;
  }

  protected addAspNetCoreCultureHeader(headers: HttpHeaders): HttpHeaders {
    let cookieLangValue = this._utilsService.getCookieValue(
      "Axis.Localization.CultureName"
    );
    if (cookieLangValue && headers && !headers.has(".AspNetCore.Culture")) {
      headers = headers.set(".AspNetCore.Culture", cookieLangValue);
    }

    return headers;
  }

  protected addAcceptLanguageHeader(headers: HttpHeaders): HttpHeaders {
    let cookieLangValue = this._utilsService.getCookieValue(
      "Axis.Localization.CultureName"
    );
    if (cookieLangValue && headers && !headers.has("Accept-Language")) {
      headers = headers.set("Accept-Language", cookieLangValue);
    }

    return headers;
  }

  protected addTenantIdHeader(headers: HttpHeaders): HttpHeaders {
    let cookieTenantIdValue = this._utilsService.getCookieValue(
      axis.tenancy.tenantIdCookieName
    );
    if (
      cookieTenantIdValue &&
      headers &&
      !headers.has(axis.tenancy.tenantIdCookieName)
    ) {
      headers = headers.set(
        axis.tenancy.tenantIdCookieName,
        cookieTenantIdValue
      );
    }

    return headers;
  }

  protected addTenantHostHeader(headers: HttpHeaders): HttpHeaders {
    let headerAttribute = axis.tenancy.headerAttribute;
    let tenancy = AppConstants.tenancy;

    if (headerAttribute && headers && !headers.has(headerAttribute)) {
      if (tenancy !== undefined && tenancy.overwriteHeaderAttribute) {
        headers = headers.set( headerAttribute, tenancy.host);
      } else {
        headers = headers.set( headerAttribute, this.getHostName());
      }
    }

    return headers;
  }

  protected addAuthorizationHeaders(headers: HttpHeaders): HttpHeaders {
    let authorizationHeaders = headers ? headers.getAll("Authorization") : null;
    if (!authorizationHeaders) {
      authorizationHeaders = [];
    }

    if (
      !this.itemExists(
        authorizationHeaders,
        (item: string) => item.indexOf("Bearer ") == 0
      )
    ) {
      let token = this._tokenService.getToken();
      if (headers && token) {
        headers = headers.set("Authorization", "Bearer " + token);
      }
    }

    return headers;
  }

  protected handleSuccessResponse(event: HttpEvent<any>): Observable<HttpEvent<any>> {
    var self = this;

    if (event instanceof HttpResponse) {
      if (
        event.body instanceof Blob &&
        event.body.type &&
        event.body.type.indexOf("application/json") >= 0
      ) {
        return self.configuration.extractContent(event.body).pipe(
          map((json) => {
            const responseBody = json == "null" ? {} : JSON.parse(json);

            var modifiedResponse = self.configuration.handleResponse(
              event.clone({
                body: responseBody,
              })
            );

            return modifiedResponse.clone({
              body: new Blob([JSON.stringify(modifiedResponse.body)], {
                type: "application/json",
              }),
            });
          })
        );
      }
    }
    return of(event);
  }

  protected handleErrorResponse(error: any): Observable<never> {

    return this.configuration.extractContent(error.error).pipe(
      switchMap((json) => {
        const errorBody = json == "" || json == "null" ? {} : JSON.parse(json);
        const errorResponse = new HttpResponse({
          headers: error.headers,
          status: error.status,
          body: errorBody
        });

        var ajaxResponse = this.configuration.getAxisAjaxResponseOrNull(errorResponse);

        if (ajaxResponse != null) {
          this.configuration.handleAxisResponse(errorResponse, ajaxResponse);
        } else {
          this.configuration.handleNonAxisErrorResponse(errorResponse);
        }

        return throwError(error);
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
    return (
      document.location.hostname + port
    );
  }
}
