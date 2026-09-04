import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { DefaultHeaders, GET, HttpService, Path, Query } from '../../async/http';

/**
 * Read ONE resource whose collection path is not known until runtime.
 *
 * The gap this fills. Every screen that follows a POLYMORPHIC pointer — an
 * invoice's `invoiceableType`, a ledger party's `lookupUrl` — knows the
 * collection only as a string the registry hands it, and the `@GET` decorator
 * bakes its path at class-definition time. So five screens reached for a raw
 * `HttpClient` instead, and with it lost the one thing the layer guarantees:
 * `HttpAdapter.baseAdapter`'s snake_case -> camelCase conversion. Each then
 * re-implemented that conversion by hand and half-wrong — reading
 * `doc[camel] ?? doc[snake]` per field, a field at a time (see the
 * bill/credit-memo/debit-memo/invoice create forms, `pos` batch picker).
 *
 * That workaround is what made `UF-S6.35` hard to see: when every read is
 * defensive, a genuinely absent value looks like just another casing miss.
 *
 * The path is dynamic but NOT free-form: `createPath` substitutes `{url}` and
 * `{id}` positionally, the base URL is still `AppConfig.remoteServiceBaseUrl`,
 * and the response goes through the same interceptor and adapter as every
 * generated service. Callers pass a collection path they already hold from the
 * registry (`/purchase-orders`, `/receive-notes`, …), never operator input.
 */
@Injectable({ providedIn: 'root' })
@DefaultHeaders({
  Accept: 'application/json',
  'Content-Type': 'application/json'
})
export class ResourceHttpService extends HttpService {
  /**
   * `GET {url}/{id}?include=…`
   *
   * @param url  collection path WITH its leading slash, e.g. `/purchase-orders`
   * @param id   the resource id
   * @param include comma-separated relations, e.g. `items` or `vendor,items.product_sku`
   */
  @GET('{url}/{id}')
  public getByPath(
    @Path('url') url: string,
    @Path('id') id: string,
    @Query('include') include?: string
  ): Observable<any> {
    return null;
  }
}
