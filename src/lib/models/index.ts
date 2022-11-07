export interface IValidationErrorInfo {
  message: string;

  members: string[];
}

export interface IErrorInfo {
  code: number;

  message: string;

  details: string;

  validationErrors: IValidationErrorInfo[];
}

export interface IAxisResponse {
  success: boolean;

  result?: any;

  redirectUrl?: string;

  error?: IErrorInfo;

  unAuthorizedRequest: boolean;

  __axis: boolean;
}
