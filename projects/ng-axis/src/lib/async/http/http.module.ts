import { CommonModule }        from "@angular/common";
import {
  NgModule,
  ModuleWithProviders
}                              from "@angular/core";
import { HttpService }         from './http.service';

@NgModule({
  imports: [CommonModule]
})
export class HttpServiceModule {
  static forRoot(): ModuleWithProviders<HttpServiceModule> {
    return {
      ngModule: HttpServiceModule,

      providers: [
        HttpService
      ]
    };
  }
}
