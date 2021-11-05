import { Injectable }           from "@angular/core";
import {
  HttpClient,
  HttpResponse
}                               from "@angular/common/http";
import { Observable, throwError as _observableThrow } from "rxjs";
import { mergeMap as _observableMergeMap, catchError as _observableCatch } from "rxjs/operators";
import { HttpAdapter }          from './http.adapter';
import { AppConstants }         from '../../app-constants';
import {convertObjectKeysToCamel, convertObjectKeysToSnake} from "../../services";

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
  protected requestInterceptor(requestOptions: any) {

    // check request keys conversion settings
    if(AppConstants.responseObjectKeys.convert && requestOptions.body !== undefined) {
      if(AppConstants.responseObjectKeys.targetCase === 'camelCase') {
        requestOptions.body = HttpService.convertRequestObjectKeysToCamel(requestOptions.body);
      } else if(AppConstants.responseObjectKeys.targetCase === 'snake_case') {
        requestOptions.body = HttpService.convertRequestObjectKeysToSnake(requestOptions.body);
      }
    }

    return requestOptions
  }

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

  static convertRequestObjectKeysToCamel(response: any){
    return Object.assign({}, response, convertObjectKeysToCamel(response));
  }

  static convertRequestObjectKeysToSnake(response: any){
    return Object.assign({}, response, convertObjectKeysToSnake(response));
  }
}

