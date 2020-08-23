import {Injectable} from "@angular/core";

@Injectable()
export class AppConstants {

  static remoteServiceBaseUrl: string = "";
  static appBaseUrl: string = "";
  static appBaseHref: string = ""; // returns angular's base-href parameter value if used during the publish

  static localeMappings: any = [];

  static readonly userManagement = {
    defaultAdminUserName: "admin"
  };

  static readonly localization = {
    defaultLocalizationSourceName: "" // AppConstants
  };

  static readonly authorization = {
    encryptedAuthTokenName: "" // enc_auth_token
  };
}
