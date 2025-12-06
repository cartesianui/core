import { HttpHeaders, HttpParams, HttpResponse } from '@angular/common/http';
import { Observable, switchMap, of } from 'rxjs';
import { AppConfig } from '../../app-config';
import { HttpService } from './http.service';
import { isObject } from '../../utils';

export function methodBuilder(method: string) {
  return function (url: string, key: string = null) {
    return function (target: HttpService, propertyKey: string, descriptor: any) {

      // const originalMethod = descriptor.value;

      const pPath = target[`${propertyKey}_Path_parameters`],
        pQuery = target[`${propertyKey}_Query_parameters`],
        pBody = target[`${propertyKey}_Body_parameters`],
        pHeader = target[`${propertyKey}_Header_parameters`],
        pCriteria = target[`${propertyKey}_Criteria_parameters`];

      descriptor.value = function (...args: any[]) {
        const body: string = createBody(pBody, descriptor, args);
        const resUrl: string = createPath(url ? url : AppConfig.apiEndpoints[key], pPath, args);
        const headers: HttpHeaders = createHeaders(pHeader, descriptor, this.getDefaultHeaders(), args);
        const criteriaParams: HttpParams | boolean = createHttpParamsFromCriteria(pCriteria, args);
        const params: HttpParams = createHttpParamsFromQuery(criteriaParams instanceof HttpParams ? criteriaParams : new HttpParams(), pQuery, args);

        let options: any = {
          body: body,
          observe: 'response',
          responseType: 'blob',
          headers: headers
        };

        if (params && params instanceof HttpParams) {
          options.params = params;
        }

        // intercept the request
        options = this.requestInterceptor(options);

        // make the request and store the observable for later transformation
        let observable: Observable<HttpResponse<any>> = this.http.request(method, this.getBaseUrl() + resUrl, options);

        // intercept the response
        observable = this.responseInterceptor(observable, descriptor.adapter);

        // ✅ run actual method code with its original arguments
        //const originalResult = originalMethod.apply(this, args);

        // if actual method returned something, merge it with observable
        // if (originalResult) {
        //   observable = observable.pipe(
        //     switchMap((response) => {
        //       // you decide whether to prefer originalResult or response
        //       return of(originalResult ?? response);
        //     })
        //   );
        // }

        return observable;
      };

      return descriptor;
    };
  };
}

export function paramBuilder(paramName: string) {
  return function (key: string) {
    return function (target: HttpService, propertyKey: string | symbol, parameterIndex: number) {
      var metadataKey = `${String(propertyKey)}_${paramName}_parameters`;
      var paramObj: any = {
        key: key,
        parameterIndex: parameterIndex
      };

      if (Array.isArray(target[metadataKey])) target[metadataKey].push(paramObj);
      else target[metadataKey] = [paramObj];
    };
  };
}

function createBody(pBody: Array<any>, descriptor: any, args: Array<any>): string {
  if (descriptor.isFormData) {
    return args[0];
  } else {
    if (pBody && isObject(args[pBody[0].parameterIndex])) {
      return JSON.stringify(args[pBody[0].parameterIndex]);
    } else {
      return null;
    }
  }
}

function createPath(url: string, pPath: Array<any>, args: Array<any>): string {
  var resUrl: string = url;

  if (pPath) {
    for (var k in pPath) {
      if (pPath.hasOwnProperty(k)) {
        resUrl = resUrl.replace('{' + pPath[k].key + '}', args[pPath[k].parameterIndex]);
      }
    }
  }

  return resUrl;
}

function createHttpParamsFromQuery(params: HttpParams, pQuery: any, args: Array<any>): HttpParams {
  if (pQuery) {
    pQuery
      .filter((p) => args[p.parameterIndex]) // filter out optional parameters
      .forEach((p) => {
        let key = p.key;
        let value = args[p.parameterIndex];
        // if the value is a instance of Object, we stringify it
        if (value instanceof Object) {
          value = JSON.stringify(value);
        }
        params = params.append(encodeURIComponent(key), encodeURIComponent(value));
      });
  }

  return params;
}


function createHttpParamsFromCriteria(pCriteria: unknown, args: any[]): HttpParams | boolean {
  const param = pCriteria?.[0];
  const arg = param ? args[param.parameterIndex] : null;

  if (arg instanceof HttpParams) {
    return arg;
  }

  if (arg && typeof arg.toString === 'function') {
    // If it can be converted to string, e.g., RequestCriteria or query string
    const criteria = arg.toString();
    return new HttpParams({ fromString: criteria });
  }

  return false;
}

function createHeaders(pHeader: any, descriptor: any, defaultHeaders: any, args: Array<any>): HttpHeaders {
  let httpHeaders = new HttpHeaders(defaultHeaders);

  // set method specific headers
  for (var k in descriptor.headers) {
    if (descriptor.headers.hasOwnProperty(k)) {
      if (httpHeaders.has(k)) httpHeaders.delete(k);
      httpHeaders.append(k, descriptor.headers[k]);
    }
  }

  // set parameter specific headers
  if (pHeader) {
    for (var k in pHeader) {
      if (pHeader.hasOwnProperty(k)) {
        if (httpHeaders.has(k)) httpHeaders.delete(k);
        httpHeaders.append(pHeader[k].key, args[pHeader[k].parameterIndex]);
      }
    }
  }

  return httpHeaders;
}
