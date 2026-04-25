import { Injectable } from '@angular/core';
import { HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConfig } from '../../app-config';
import { MessageService, NotifyService, LogService } from '../../services';
import { extractContent, isArray } from '../../utils';
import { IErrorInfo, ICartesianResponse } from './types';
import { HttpErrorService } from './http-error.service';

@Injectable({
  providedIn: 'root'
})
export class HttpResponseService {
  constructor(
    private _messageService: MessageService,
    private _notifySertvice: NotifyService,
    private _logService: LogService,
    private _errorService: HttpErrorService
  ) {
    this._notifier = AppConfig.interceptor.error.presenter === 'message' ? _messageService : _notifySertvice;
  }

  _notifier: MessageService | NotifyService;

  defaultError = <IErrorInfo>{
    message: 'An error has occurred!',
    details: 'Error details were not sent by server.'
  };

  defaultError401 = <IErrorInfo>{
    message: 'You are not authenticated!',
    details: 'You should be authenticated (sign in) in order to perform this operation.'
  };

  defaultError403 = <IErrorInfo>{
    message: 'You are not authorized!',
    details: 'You are not allowed to perform this operation.'
  };

  defaultError404 = <IErrorInfo>{
    message: 'Resource not found!',
    details: 'The resource requested could not be found on the server.'
  };

  defaultError504 = <IErrorInfo>{
    message: 'Gateway Timeout!',
    details: 'Server is not responding, try again after sometime.'
  };

  mergeError(error: IErrorInfo, append?: IErrorInfo) {
    if(!append)
      return { ...error };

    return {
      ...error,
      details: error.details + '<br>' + append.details
    };
  }

  logError(error: IErrorInfo): void {
    this._logService.error(error);
  }

  getErrorInfoFromCode(code): IErrorInfo {
    return AppConfig.defaultHttpErrorCodes[code];
  }

  showError(error: IErrorInfo): any {
    if (error.details) {
      return this._notifier.error(error.details as string, (error.message as string) || (this.defaultError.message as string), {});
    } else {
      return this._notifier.error((error.message as string) || (this.defaultError.message as string));
    }
  }

  redirect(redirectUrl: string): void {
    if (!redirectUrl) {
      // location.href = "/";
    } else {
      // location.href = redirectUrl;
    }
  }

  handleUnAuthorizedResponse(messagePromise: any, redirectUrl?: string) {
    const self = this;
    if (messagePromise) {
      messagePromise.done(() => {
        this.redirect(redirectUrl || '/');
      });
    } else {
      self.redirect(redirectUrl || '/');
    }
  }

  handleErrorResponse(response: HttpResponse<any>, errorInfo: IErrorInfo = null, redirectUrl?: string) {
    const self = this;
    let error: IErrorInfo;
  
    switch (response.status) {
      case 401:
        error = self.mergeError(self.defaultError401, errorInfo);
        break;
      case 403:
        error = self.mergeError(self.defaultError403, errorInfo);
        break;
      case 404:
        error = self.mergeError(self.defaultError404, errorInfo);
        break;
      case 504:
        error = self.mergeError(self.defaultError504, errorInfo);
        break;
      default:
        if(!errorInfo) {
          error = self.getErrorInfoFromCode(response.status) ?? self.defaultError;
        } else {
          error = errorInfo;
        }
        break;
    }

    if(response.status === 401) {
      self.handleUnAuthorizedResponse(error, redirectUrl ?? '/');
    } else {
      this.logError(error);
      self.showError(error);
    }
  }

  getCartesianResponse(response: HttpResponse<any>): ICartesianResponse | null {
    if (!response || !response.headers) {
      return null;
    }

    const contentType = response.headers.get('Content-Type');
    if (!contentType) {
      this._logService.warn('Content-Type is not sent!');
      return null;
    }

    if (contentType.indexOf('application/json') < 0) {
      this._logService.warn('Content-Type is not application/json: ' + contentType);
      return null;
    }

    const responseObj = JSON.parse(JSON.stringify(response.body));
    responseObj.__cartesian = true;

    return responseObj as ICartesianResponse;
  }

  handleCartesianResponse(response: HttpResponse<any>, cartesianResponse: ICartesianResponse): HttpResponse<any> {
    let cloneResponse: HttpResponse<any>;

    if ((cartesianResponse.data == null || cartesianResponse.data == undefined) && cartesianResponse.message) {
      const { errors, message } = cartesianResponse;
      const error: IErrorInfo = this.defaultError;
      const details: string[] = [];
    
      if (message) {
        details.push(message);
      }

      if (errors) {
        // Dispatch ERRORS to caught by service obervers
        this._errorService.dispatch(errors);

        const summary = Object.keys(errors).reduce(function (res, v) {
          if (isArray(errors[v])) {
            res = res.concat(errors[v] as string[]);
          } else res.push(errors[v] as string);
          return res;
        }, [] as string[]);
        details.concat(summary);
      }

      if(details.length) {
        error.details = details.join('<br>');
      }

      cloneResponse = response.clone({
        body: { errors: errors, message: message }
      });

      this.handleErrorResponse(cloneResponse, error, cartesianResponse?.__redirectUrl);

    } else {
      const { data, meta, ...rest } = cartesianResponse;
      cloneResponse = response.clone({
        body: { data: data, meta: meta, ...rest }
      });
      if (cartesianResponse.__redirectUrl) {
        this.redirect(cartesianResponse.__redirectUrl);
      }
    }
    return cloneResponse;
  }

  handleResponse(response: HttpResponse<any>): HttpResponse<any> {
    const cartesianResponse = this.getCartesianResponse(response);
    if (cartesianResponse == null) {
      return response;
    }

    return this.handleCartesianResponse(response, cartesianResponse);
  }

  extractContent(content: any): Observable<any> {
    return extractContent(content);
  }
}
