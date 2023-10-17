import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { AppConstants } from '../../app-constants';
import { IError } from './types';
import { convertObjectKeysToCamel } from '../../services/utils/helpers';

@Injectable({
  providedIn: 'root'
})
export class HttpNotificationService {
  public serverErrors$ = new Subject<IError>();

  static convertResponseObjectKeysToCamel(response: any) {
    return Object.assign({}, convertObjectKeysToCamel(response));
  }

  dispatch(errors: IError) {
    if (AppConstants.convertResponseObjectKeysToCamel) {
      errors = HttpNotificationService.convertResponseObjectKeysToCamel(errors);
    }

    this.serverErrors$.next(errors);
  }
}
