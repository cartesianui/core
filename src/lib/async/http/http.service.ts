import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { mergeMap, catchError } from 'rxjs/operators';
import { HttpAdapter } from './http.adapter';
import { AppConfig } from '../../app-config';
import { ObjectUtils } from '../../utils';

/**
 * Supported @Produces media types
 */
export enum MediaType {
  JSON,
  FORM_DATA
}

@Injectable()
export class HttpService {
  public constructor(protected http: HttpClient) {}

  protected getBaseUrl(): string {
    return AppConfig.remoteServiceBaseUrl;
  }

  protected getDefaultHeaders(): Object {
    return null;
  }

  /**
   * Request Interceptor
   *
   * @method requestInterceptor
   * @param {Request} req - request object
   */
  protected requestInterceptor(requestOptions: any) {
    //check response keys conversion settings
    // TODO: Revisit this check - any other approach
    if (AppConfig.keysFormatAPI !== AppConfig.keysFormatAPP && !(requestOptions.body instanceof FormData)) {
      requestOptions.body = ObjectUtils.convertObjectKeys(requestOptions.body, AppConfig.keysFormatAPP, AppConfig.keysFormatAPI);
    }

    return requestOptions;
  }

  /**
   * Response Interceptor
   *
   * @method responseInterceptor
   * @param {Response} observableRes - response object
   * @returns {Response} res - transformed response object
   */
  protected responseInterceptor(observableRes: Observable<any>, adapterFn?: Function): Observable<any> {
    return observableRes
      .pipe(
        mergeMap((response_: any) => {
          return HttpAdapter.baseAdapter(response_, adapterFn);
        })
      )
      .pipe(
        catchError((response_: any) => {
          if (response_ instanceof HttpResponse) {
            try {
              return HttpAdapter.baseAdapter(response_, adapterFn);
            } catch (e) {
              return <Observable<any>>(<any>throwError(() => e));
            }
          } else return <Observable<any>>(<any>throwError(() => response_));
        })
      );
  }
}
