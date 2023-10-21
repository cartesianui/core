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

// Request Errors
export type IError = {
  [key: string]: Array<string> | string;
};

export type IErrorInfo = {
  cose?: string | number;
  message?: string;
  details?: string;
};

export type ICartesianResponse = {
  data?: any;
  meta?: any;
  access_token?: string;
  expire_in?: any;
  refresh_token?: string;
  token_type?: string;
  message?: string;
  errors?: IError;
  __redirect_url?: string;
  __cartesian?: boolean;
};
