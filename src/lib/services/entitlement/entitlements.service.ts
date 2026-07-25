import { Injectable, inject, signal } from '@angular/core';
import { EntitlementsHttpService } from './http.service';

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

  // "key" -> boolean gate value; "key.limitKey" -> numeric detail value.
  // Both stored as the raw string the BE sends ('true'/'false' or a number
  // string) — parsed on read, not on write.
  private readonly rows = signal<Record<string, string>>({});

  /** True once the first response (success or failure) has landed. */
  readonly loaded = signal(false);

  private requested = false;

  /** Fetch once. Safe to call more than once — only the first call fires. */
  load(): void {
    if (this.requested) return;
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
        this.loaded.set(true);
      },
      // Fail open — a load error must never hide nav the tenant is
      // actually entitled to; the BE gate is the real backstop.
      error: () => this.loaded.set(true)
    });
  }

  /**
   * Whether the tenant's plan includes this entitlement key's boolean gate.
   * Fails OPEN (true) until loaded, so nav doesn't flash-hide before the
   * first response — see class doc.
   */
  has(key: string): boolean {
    if (!this.loaded()) return true;
    return this.rows()[key] === 'true';
  }

  /** A numeric detail under a key (e.g. 'store' + 'max_stores'), or undefined if unset. */
  limit(key: string, limitKey: string): number | undefined {
    const v = this.rows()[`${key}.${limitKey}`];
    return v !== undefined && v !== null && v !== '' ? Number(v) : undefined;
  }
}
