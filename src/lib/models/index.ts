// Request Errors
export interface IErrorInfo {
  [key:string]: Array<string> | string
}

export interface IAxisResponse {

  data?: any;

  meta?: any;

  message?: string,

  errors?: Array<IErrorInfo>;

  __redirectUrl?: string;

  __axis?: boolean;
}
