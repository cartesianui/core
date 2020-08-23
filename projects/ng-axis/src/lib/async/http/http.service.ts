import { Injectable }           from "@angular/core";
import {
  HttpClient,
  HttpRequest,
  HttpResponse,
  HttpResponseBase
}                               from "@angular/common/http";
import { Observable, throwError as _observableThrow } from "rxjs";
import { map as _observableMap, mergeMap as _observableMergeMap, catchError as _observableCatch } from "rxjs/operators";
import { HttpAdapter }          from './http.adapter';
import { AppConstants }         from '../../app-constants';

/**
 * Supported @Produces media types
 */
export enum MediaType {
  JSON,
  FORM_DATA
}

@Injectable()
export class HttpService {

  public constructor( protected http: HttpClient ) {}

  protected getBaseUrl(): string {
    return AppConstants.remoteServiceBaseUrl;
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
  protected requestInterceptor(req: HttpRequest<any>) {}

  /**
  * Response Interceptor
  *
  * @method responseInterceptor
  * @param {Response} observableRes - response object
  * @returns {Response} res - transformed response object
  */
  protected responseInterceptor(observableRes: Observable<any>, adapterFn?: Function): Observable<any> {
    return observableRes.pipe( _observableMergeMap((response_ : any) => {
        return HttpAdapter.baseAdapter(response_, adapterFn);
    })).pipe(_observableCatch((response_: any) => {
      if (response_ instanceof HttpResponse) {
        try {
          return HttpAdapter.baseAdapter(response_, adapterFn);
        } catch (e) {
          return <Observable<any>><any>_observableThrow(e);
        }
      } else
        return <Observable<any>><any>_observableThrow(response_);
    }));
  }
}

