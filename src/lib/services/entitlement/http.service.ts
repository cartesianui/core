import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { DefaultHeaders, GET, HttpService } from '../../async/http';

/**
 * Tenant self-service read of its own materialized entitlement rows —
 * scoped server-side to the authenticated user's own tenant, never a
 * client-supplied id. Declarative (not a raw `HttpClient` call) so the
 * response goes through the same retrofit adapter every other HTTP service
 * gets — including the snake_case -> camelCase conversion
 * (`HttpAdapter.baseAdapter`, driven by `AppConfig.keysFormatAPI/APP`) —
 * for free, with no manual `convertObjectKeysToCamel()` step to forget.
 */
@Injectable({ providedIn: 'root' })
@DefaultHeaders({
  Accept: 'application/json',
  'Content-Type': 'application/json'
})
export class EntitlementsHttpService extends HttpService {
  @GET('/my-tenant/entitlements')
  public getMine(): Observable<any> {
    return null;
  }
}
