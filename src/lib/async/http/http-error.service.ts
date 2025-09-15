import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';
import { AppConfig } from '../../app-config';
import { IError } from './types';
import { ObjectUtils } from '../../utils';

@Injectable({
  providedIn: 'root'
})
export class HttpErrorService {
  public serverErrors$ = new Subject<IError>();

  dispatch(errors: IError) {
    // check response keys conversion settings
    if (AppConfig.keysFormatAPI !== AppConfig.keysFormatAPP) {
      errors = ObjectUtils.convertObjectKeys(errors, AppConfig.keysFormatAPI, AppConfig.keysFormatAPP);
    }

    this.serverErrors$.next(errors);
  }
}
