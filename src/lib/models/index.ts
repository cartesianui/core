// Request Errors
export interface IErrorInfo {
  [key:string]: Array<string> | string
}

export interface IAxisResponse {

  data?: any;

  meta?: any;

  access_token?: string;

  expire_in?: any;

  refresh_token?: string;

  token_type?: string;

  message?: string,

  errors?: Array<IErrorInfo>;

  __redirect_url?: string;

  __axis?: boolean;
}
