import { Injectable, inject, signal } from '@angular/core';
import { EntitlementsHttpService } from './http.service';
import { TokenService } from '../auth/token.service';

/**
 * FE side of the BE entitlement gate (`Cartesian\Entitlement\EntitlementRegistry`
 * + `tenant_entitlements`, see docs/platform-core/feature-gating-hardening).
 * Fetches the tenant's own materialized rows once from the existing
 * `GET /my-tenant/entitlements` endpoint and exposes them as signals — for
 * hiding nav items the tenant's plan doesn't include (G4: FE shows only
 * enabled plan/feature menus), NOT for security. The BE gate
 * (`EnsureFeatureEntitled` middleware) is the actual enforcement; this is
 * UX only, so it fails OPEN (shows everything) until the first response
 * lands and on any load error — an unentitled tenant hitting a hidden
 * route directly still gets a real 403 from the BE.
 *
 * Modelled on `StoreContextService` (shopifier/core): plain signal state +
 * one fetch-once HTTP call, no NgRx — entitlements gate the SHELL nav,
 * which renders before any feature lib's lazy-loaded store exists, so this
 * can't depend on the `system/plan` library's `TenantEntitlement` NgRx
 * feature (that lib is a consumer of this data for its own host/self-service
 * screens, not a provider other libs should depend on).
 *
 * Reads via the declarative `EntitlementsHttpService` (not a raw
 * `HttpClient` call) — the retrofit adapter it extends does snake_case ->
 * camelCase conversion automatically (see that class's doc), so response
 * rows arrive already as `entitlementKey`/`limitKey`/`value`.
 */
@Injectable({ providedIn: 'root' })
export class EntitlementsService {
  private httpService = inject(EntitlementsHttpService);
  private tokenService = inject(TokenService);

  // "key" -> boolean gate value; "key.limitKey" -> numeric detail value.
  // Both stored as the raw string the BE sends ('true'/'false' or a number
  // string) — parsed on read, not on write.
  private readonly rows = signal<Record<string, string>>({});

  /** True once the first response (success or failure) has landed. */
  readonly loaded = signal(false);

  /**
   * The last attempt failed. Kept separate from `loaded` because the two mean
   * different things to `has()` — see the fail-open note there.
   */
  private readonly errored = signal(false);

  private requested = false;

  /**
   * Fetch once per authenticated session.
   *
   * Skips entirely when there is no token, WITHOUT marking the fetch as
   * requested. The app initializer runs this on every boot — including on the
   * login page, where the user is anonymous. That anonymous call 401'd, and
   * the error handler used to mark the service `loaded` with no rows, which
   * flipped `has()` from fail-open to fail-CLOSED for the rest of the page's
   * life. Because `requested` was already latched, the post-login call was a
   * no-op, so the nav stayed collapsed until a manual reload — where boot
   * happened to run once, with a token.
   *
   * That is QA-N1: only Sales / Accounting / Admin visible after login. Those
   * are exactly the three workspace sections with no `entitlements` gate; every
   * other section was hidden by a `has()` that had silently gone fail-closed.
   */
  load(): void {
    if (this.requested) return;

    // Anonymous — nothing to fetch, and crucially nothing to latch. The next
    // call (post-login, with a token) is the one that counts.
    if (!this.tokenService.getToken()) return;

    this.requested = true;

    this.httpService.getMine().subscribe({
      next: (res) => {
        const data = res?.data ?? [];
        const map: Record<string, string> = {};
        for (const row of data) {
          const key = row.limitKey ? `${row.entitlementKey}.${row.limitKey}` : row.entitlementKey;
          map[key] = row.value;
        }
        this.rows.set(map);
        this.errored.set(false);
        this.loaded.set(true);
      },
      // Fail open — a load error must never hide nav the tenant is
      // actually entitled to; the BE gate is the real backstop.
      error: () => {
        this.errored.set(true);
        this.loaded.set(true);
      }
    });
  }

  /**
   * Force a re-fetch, e.g. after the user signs in and the token changes.
   * `load()` alone latches on first call and would no-op.
   */
  reload(): void {
    this.requested = false;
    this.load();
  }

  /**
   * Whether the tenant's plan includes this entitlement key's boolean gate.
   *
   * Fails OPEN (true) until loaded AND on a failed load, so nav neither
   * flash-hides before the first response nor collapses because the request
   * failed. The class doc always claimed the error case failed open; it did
   * not — `loaded` was set on error while `rows` stayed empty, so every lookup
   * returned false. The BE gate is the real enforcement, so open is the
   * correct direction to be wrong in.
   */
  has(key: string): boolean {
    if (!this.loaded() || this.errored()) return true;
    return this.rows()[key] === 'true';
  }

  /** A numeric detail under a key (e.g. 'store' + 'max_stores'), or undefined if unset. */
  limit(key: string, limitKey: string): number | undefined {
    const v = this.rows()[`${key}.${limitKey}`];
    return v !== undefined && v !== null && v !== '' ? Number(v) : undefined;
  }
}
