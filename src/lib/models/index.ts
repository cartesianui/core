// Request Errors
export interface IError {
  [key:string]: Array<string> | string;
}

export interface IErrorInfo {
  message?: string;
  details?: string;
}

export interface IAxisResponse {

  data?: any;

  meta?: any;

  access_token?: string;

  expire_in?: any;

  refresh_token?: string;

  token_type?: string;

  message?: string,

  errors?: IError;

  __redirect_url?: string;

  __axis?: boolean;
}
