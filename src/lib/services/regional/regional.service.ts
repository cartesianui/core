import { Injectable } from '@angular/core';

/**
 * Read access to the runtime `cartesian.regional` block (resolved
 * formatting/locale/timezone preferences from tenant + user config).
 *
 * Single chokepoint for all FE consumers — pickers, formatters, date
 * pipes, etc. Mirrors `LocalizationService` (translation runtime) but for
 * regional formatting concerns.
 *
 * All getters fall back to sensible defaults so callers don't crash when
 * the configurations bundle hasn't loaded yet (early app boot, unauth
 * contexts).
 *
 * **`displayCurrency()` naming intentional** — it surfaces that the value
 * is cosmetic only (drives `Intl.NumberFormat({style: 'currency', ...})`).
 * `cartesian.storageCurrency` holds the actual install-wide canonical
 * currency in which amounts are persisted; FX conversion is out of scope.
 * See localization workstream D8.
 */
@Injectable({
  providedIn: 'root',
})
export class RegionalService {
  get timeZone(): string {
    return cartesian.regional?.timeZone ?? 'Asia/Karachi';
  }

  get locale(): string {
    return cartesian.regional?.locale ?? 'en-PK';
  }

  /**
   * Display currency code only — does NOT alter stored amounts.
   * For the install-wide canonical storage currency, see
   * `cartesian.storageCurrency` (or `storageCurrency` getter below).
   */
  get displayCurrency(): string {
    return cartesian.regional?.currency ?? 'PKR';
  }

  /**
   * Install-wide canonical currency in which all decimals are persisted.
   * Never changes per-tenant or per-user.
   */
  get storageCurrency(): string {
    return cartesian.storageCurrency ?? 'PKR';
  }

  shortDateFormat(): string {
    return cartesian.regional?.dateFormat?.short ?? 'dd/MM/yyyy';
  }

  mediumDateFormat(): string {
    return cartesian.regional?.dateFormat?.medium ?? 'dd MMM yyyy';
  }

  longDateFormat(): string {
    return cartesian.regional?.dateFormat?.long ?? 'EEEE, dd MMMM yyyy';
  }
}