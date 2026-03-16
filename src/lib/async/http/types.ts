import { HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export type Operator = string;

export type Value = string | string[] | number | number[] | null;

export type OrderDirection = 'asc' | 'desc';

export type ColumnItem = [string, Operator | Value, Value?];

export type Column = Array<ColumnItem>;

export type Comparison = 'and' | 'or';

export type WhereOptions = { url: boolean; [key: string]: string | boolean } | null;

export type WhereItem = {
  column: string;
  operator: Operator;
  value: Value;
  options?: WhereOptions;
};

export type OrderItem = {
  column: string;
  direction: OrderDirection;
};

export type Fields = {
  search: string[];
  searchFields: string[];
  orderBy: string[];
  sortedBy: string[];
  with: string[];
  filter: string[];
  page: number[];
  limit: number[];
  searchJoin: [Comparison];
} & { [key: string]: Fields[keyof Fields] };

export type SearchForm = Record<string, WhereItem>;

export type Pairs = {
  search?: string;
  searchFields?: string;
  orderBy?: string;
  sortedBy?: string;
  with?: string;
  filter?: string;
  page?: string;
  limit?: string;
  searchJoin?: string;
} & { [key: string]: Pairs[keyof Pairs] };


export type RequestCriteriaOuput = HttpParams;

// Request Errors
export type IError = {
  [key: string]: Array<string> | string;
};

export type IErrorInfo = {
  code?: string | number;
  message?: string; // as title
  details?: string;
};

export type ICartesianResponse = {
  data?: any;
  meta?: any;
  accessToken?: string;
  expireIn?: any;
  refreshToken?: string;
  tokenType?: string;
  message?: string;
  errors?: IError;
  __redirectUrl?: string;
  __cartesian?: boolean;
};

export type HttpServiceExtendedFunction =
  (...args: unknown[]) => Observable<ICartesianResponse>;

export type IHttpServiceExtension =
  Record<string, HttpServiceExtendedFunction>;

export type IHttpService<
  TModel,
  THttpServiceExtension  extends IHttpServiceExtension = {}
> = {
  getAll?: (criteria: RequestCriteriaOuput) => Observable<ICartesianResponse>;
  getById?: (id: string, includes?: string) => Observable<ICartesianResponse>;
  create?: (model: TModel) => Observable<ICartesianResponse>;
  update?: (
    id: string,
    changes: Partial<TModel>
  ) => Observable<ICartesianResponse>;
  delete?: (id: string) => Observable<ICartesianResponse>;
} & THttpServiceExtension;
