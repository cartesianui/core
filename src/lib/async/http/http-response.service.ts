import { Injectable } from '@angular/core';
import { HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppConstants } from '../../app-constants';
import { MessageService, NotifyService, LogService, extractContent } from '../../services';
import { IErrorInfo, IAxisResponse } from '../../models';


@Injectable({
  providedIn: 'root'
})
export class HttpResponseService {
  constructor(private _messageService: MessageService, private _notifySertvice: NotifyService, private _logService: LogService) {
    this._notifier = AppConstants.interceptor.error.presenter === 'message' 
                            ? _messageService 
                            : _notifySertvice;
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

  showError(error: IErrorInfo): any {
    if (error.details) {
      return this._notifier.error(error.details, error.message || this.defaultError.message);
    } else {
      return this._notifier.error(error.message || this.defaultError.message);
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

  handleNonAxisErrorResponse(response: HttpResponse<any>) {
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
        self.showError(self.defaultError);
        break;
    }
  }

  handleAxisResponse(response: HttpResponse<any>, axisResponse: IAxisResponse): HttpResponse<any> {
    var cloneResponse: HttpResponse<any>;

    if (axisResponse.success) {
      cloneResponse = response.clone({
        body: axisResponse.result
      });

      if (axisResponse.redirectUrl) {
        this.redirect(axisResponse.redirectUrl);
      }
    } else {
      cloneResponse = response.clone({
        body: axisResponse.result
      });

      if (!axisResponse.error) {
        axisResponse.error = this.defaultError;
      }

      this.logError(axisResponse.error);
      this.showError(axisResponse.error);

      if (response.status === 401) {
        this.handleUnAuthorizedResponse(null, axisResponse.redirectUrl);
      }
    }

    return cloneResponse;
  }

  getAxisResponseOrNull(response: HttpResponse<any>): IAxisResponse | null {
    if (!response || !response.headers) {
      return null;
    }

    var contentType = response.headers.get('Content-Type');
    if (!contentType) {
      this._logService.warn('Content-Type is not sent!');
      return null;
    }

    if (contentType.indexOf('application/json') < 0) {
      this._logService.warn('Content-Type is not application/json: ' + contentType);
      return null;
    }

    var responseObj = JSON.parse(JSON.stringify(response.body));
    if (!responseObj.__axis) {
      return null;
    }

    return responseObj as IAxisResponse;
  }

  handleResponse(response: HttpResponse<any>): HttpResponse<any> {
    var axisResponse = this.getAxisResponseOrNull(response);
    if (axisResponse == null) {
      return response;
    }

    return this.handleAxisResponse(response, axisResponse);
  }

  extractContent(content: any): Observable<string> {
    return extractContent(content);
  }
}
