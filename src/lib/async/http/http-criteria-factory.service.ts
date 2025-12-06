import { Injectable } from '@angular/core';
import { RequestCriteria } from './http-criteria.service';
import { SearchForm } from './types';

@Injectable({ providedIn: 'root' })
export class RequestCriteriaFactory {
  create(form?: SearchForm): RequestCriteria {
    return new RequestCriteria(form);
  }
}