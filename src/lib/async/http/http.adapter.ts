import { HttpResponse } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { mergeMap } from 'rxjs/operators';
import { extractContent, convertObjectKeysToCamel, convertObjectKeysToSnake } from '../../services/utils/helpers';
import { AppConstants } from '../../app-constants';

export class HttpAdapter {
  static baseAdapter(response: HttpResponse<any>, adapterFn?: Function): any {
    const status = response.status;
    const body = response instanceof HttpResponse ? response.body : (<any>response).error instanceof Blob ? (<any>response).error : undefined;

    let headers: any = {};
    if (response.headers) {
      for (let key of response.headers.keys()) {
        headers[key] = response.headers.get(key);
      }
    }

    if (AppConstants.defaultHttpSuccessCodes.hasOwnProperty(status)) {
      return extractContent(body).pipe(
        mergeMap((json) => {
          let result: any = null;
          let data = json === '' ? null : JSON.parse(json);

          // If Adaptor function provided call that, otherwise return result data
          result = adapterFn ? adapterFn.call(undefined, data) : data;

          // check response keys conversion settings
          if (AppConstants.convertResponseObjectKeysToCamel) {
            result = HttpAdapter.convertResponseObjectKeysToCamel(result);
          }

          return of(result);
        })
      );
    } else if (!AppConstants.defaultHttpSuccessCodes.hasOwnProperty(status)) {
      return extractContent(body).pipe(
        mergeMap((json) => {
          return throwException('An unexpected server error occurred.', status, json, headers);
        })
      );
    }

    return of<any>(<any>null);
  }

  static convertResponseObjectKeysToCamel(response: any) {
    return Object.assign({}, convertObjectKeysToCamel(response));
  }
}

export class ApiException extends Error {
  override message: string;
  status: number;
  response: string;
  headers: { [key: string]: any };
  result: any;

  constructor(message: string, status: number, response: string, headers: { [key: string]: any }, result: any) {
    super();

    this.message = message;
    this.status = status;
    this.response = response;
    this.headers = headers;
    this.result = result;
  }

  protected isApiException = true;

  static isApiException(obj: any): obj is ApiException {
    return obj.isApiException === true;
  }
}

function throwException(message: string, status: number, response: string, headers: { [key: string]: any }, result?: any): Observable<any> {
  if (result !== null && result !== undefined) return throwError(() => result);
  else return throwError(() => new ApiException(message, status, response, headers, null));
}
