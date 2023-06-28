import { Injectable } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { mergeMap, catchError } from 'rxjs/operators';
import { HttpAdapter } from './http.adapter';
import { AppConstants } from '../../app-constants';
import { convertObjectKeysToSnake, isObject } from '../../services';

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
    return AppConstants.remoteServiceBaseUrl;
  }

  protected getDefaultHeaders(): Object {
    return null;
  }

  protected convertRequestBodyObjectKeysToSnake(object: any) {
    // If it is object, stringy to get rid of object functions etc
    // If not object, means it is already stringfied, no need to do it again, it will result in error
    // then JSON.parse to get simple JSON object
    if (isObject(object)) {
      object = JSON.stringify(object);
    }

    return Object.assign({}, convertObjectKeysToSnake(JSON.parse(object)));
  }

  /**
   * Request Interceptor
   *
   * @method requestInterceptor
   * @param {Request} req - request object
   */
  protected requestInterceptor(requestOptions: any) {
    if (AppConstants.convertRequestObjectKeysToSnake) {
      requestOptions.body = this.convertRequestBodyObjectKeysToSnake(requestOptions.body);
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
