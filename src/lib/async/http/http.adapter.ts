import { HttpResponse } from '@angular/common/http';
import { Observable, of as _observableOf } from 'rxjs';
import { throwError as _observableThrow } from 'rxjs';
import { mergeMap as _observableMergeMap } from 'rxjs/operators';
import { extractContent, convertObjectKeysToCamel, convertObjectKeysToSnake } from '../../services/utils/helpers';
import { AppConstants } from '../../app-constants';

export class HttpAdapter {
  static baseAdapter(response: HttpResponse<any>, adapterFn?: Function): any {
    const status = response.status;

    const responseBlob = response instanceof HttpResponse ? response.body : (<any>response).error instanceof Blob ? (<any>response).error : undefined;

    let _headers: any = {};
    if (response.headers) {
      for (let key of response.headers.keys()) {
        _headers[key] = response.headers.get(key);
      }
    }

    if (AppConstants.defaultHttpSuccessCodes.hasOwnProperty(status)) {
      return extractContent(responseBlob).pipe(
        _observableMergeMap((_responseText) => {
          let result: any = null;
          let resultData = _responseText === '' ? null : JSON.parse(_responseText);

          // If Adaptor function provided call that, otherwise return result data
          result = adapterFn ? adapterFn.call(undefined, resultData) : resultData;

          // check response keys conversion settings
          if (AppConstants.convertResponseObjectKeysToCamel) {
            result = HttpAdapter.convertResponseObjectKeysToCamel(result);
          }

          return _observableOf(result);
        })
      );
    } else if (!AppConstants.defaultHttpSuccessCodes.hasOwnProperty(status)) {
      return extractContent(responseBlob).pipe(
        _observableMergeMap((_responseText) => {
          return throwException('An unexpected server error occurred.', status, _responseText, _headers);
        })
      );
    }

    return _observableOf<any>(<any>null);
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
  if (result !== null && result !== undefined) return _observableThrow(result);
  else return _observableThrow(new ApiException(message, status, response, headers, null));
}
