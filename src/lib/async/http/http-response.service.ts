import { Injectable } from '@angular/core';
import { HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConstants } from '../../app-constants';
import { MessageService, NotifyService, LogService, extractContent, isArray } from '../../services';
import { IErrorInfo, ICartesianResponse } from './types';
import { HttpNotificationService } from './http-notification.service';

@Injectable({
  providedIn: 'root'
})
export class HttpResponseService {
  constructor(
    private _messageService: MessageService,
    private _notifySertvice: NotifyService,
    private _logService: LogService,
    private _errorService: HttpNotificationService
  ) {
    this._notifier = AppConstants.interceptor.error.presenter === 'message' ? _messageService : _notifySertvice;
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

  logError(error: IErrorInfo): void {
    this._logService.error(error);
  }

  getErrorInfoFromCode(code): IErrorInfo {
    return AppConstants.defaultHttpErrorCodes[code];
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

  handleErrorResponse(response: HttpResponse<any>) {
    const self = this;

    switch (response.status) {
      case 401:
        self.handleUnAuthorizedResponse(self.showError(self.defaultError401), '/');
        break;
      case 403:
        self.showError(self.defaultError403);
        break;
      case 404:
        self.showError(self.defaultError404);
        break;
      case 504:
        self.showError(self.defaultError504);
        break;
      default:
        const errorInfo: IErrorInfo = self.getErrorInfoFromCode(response.status) ?? self.defaultError;
        self.showError(errorInfo);
        break;
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

    if (cartesianResponse.errors) {
      const error: IErrorInfo = this.defaultError;
      const { errors, message } = cartesianResponse;
      if (message) {
        error.message = message;
      }
      if (errors) {
        const summary = Object.keys(errors).reduce(function (res, v) {
          if (isArray(errors[v])) {
            res = res.concat(errors[v] as string[]);
          } else res.push(errors[v] as string);
          return res;
        }, [] as string[]);
        error.details = summary.join('<br/>');
      }
      cloneResponse = response.clone({
        body: { errors: errors, message: message }
      });

      this._errorService.dispatch(errors);
      this.logError(error);
      this.showError(error);

      if (response.status === 401) {
        this.handleUnAuthorizedResponse(null, cartesianResponse?.__redirect_url);
      }
    } else {
      const { data, meta, ...rest } = cartesianResponse;
      cloneResponse = response.clone({
        body: { data: data, meta: meta, ...rest }
      });
      if (cartesianResponse.__redirect_url) {
        this.redirect(cartesianResponse.__redirect_url);
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
