

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { TokenService } from '../auth/token.service';
import { convertObjectKeysToCamel } from '../../utils/helpers';
import { AppConfig } from '../../app-config';

type IAuthUser = {
  [key: string]: string;
  name?: string | undefined;
  username?: string | undefined;
  email?: string | undefined;
};

@Injectable({
  providedIn: 'root'
})
export class SessionService {
  private _session = null;
  private _user: IAuthUser;

  constructor(
    private tokenService: TokenService,
    private httpClient: HttpClient
  ) {
    this._session = cartesian.session;
  }

  init(): Promise<any> {
    const token = this.tokenService.getToken();

    const requestHeaders = {};

    if (token) {
      requestHeaders['Authorization'] = `Bearer ${token}`;
    }

    return new Promise<IAuthUser | boolean>((resolve) => {
      this.httpClient.get<any>(AppConfig.remoteServiceBaseUrl + AppConfig.apiEndpoints.authenticatedUser, { headers: requestHeaders }).subscribe({
        next: (result: any) => {
          this._user = convertObjectKeysToCamel(result.data) as IAuthUser;
          resolve(this._user);
        },
        error: (error) => {
          resolve(false);
        }
      });
    });
  }

  get user(): IAuthUser {
    return this._user;
  }

  /**
   * Authenticated user id. Prefers `cartesian.session.userId` (populated
   * by `UserConfigurationProcessor::preServe` on the configuration bundle)
   * with fallback to the legacy `/v1/profile` payload.
   */
  get userId(): string {
    return cartesian.session?.userId?.toString() ?? this._user?.id ?? null;
  }

  /** Current tenant id (from `TenantConfigurationProcessor::preServe`). */
  get tenantId(): string | null {
    return cartesian.session?.tenantId?.toString() ?? null;
  }

  /** Current domain id (from `DomainConfigurationProcessor::preServe`). */
  get domainId(): string | null {
    return cartesian.session?.domainId?.toString() ?? null;
  }

  /** True when running inside the host tenant context. */
  get isHost(): boolean {
    return !!cartesian.session?.isHost;
  }

  /** True when the authenticated user has the admin role. */
  get isAdmin(): boolean {
    return !!cartesian.session?.isAdmin;
  }

  /** Numeric tenancy context code (1=TENANT, 2=HOST). */
  get context(): number | null {
    return cartesian.session?.context ?? null;
  }

  getShownLoginName(): string {
    return this._user.name ?? this._user.email;
  }

  /**
   * Authenticated user's image URL (HasImage `original` variant).
   * Populated by `UserConfigurationProcessor::preServe` and merged into
   * the `cartesian` global at app boot via `getConfigurations()`.
   * Falls back to null when the user has no image.
   */
  get imageUrl(): string | null {
    return (cartesian as any).profile?.imageUrl ?? null;
  }

  /** Thumbnail variant URL, or original if no thumb exists. */
  get thumbnailUrl(): string | null {
    return (cartesian as any).profile?.thumbnailUrl ?? this.imageUrl;
  }

  /** Display name from the configuration profile block. */
  get profileName(): string | null {
    return (cartesian as any).profile?.name ?? null;
  }

  /** Email from the configuration profile block. */
  get profileEmail(): string | null {
    return (cartesian as any).profile?.email ?? null;
  }

  get isHostSide(): boolean {
    return this._session.isHostSide();
  }

  /**
   * True for an admin operating in the HOST tenant context.
   *
   * RPH-026 (roles-permission-hardening): previously delegated to the legacy
   * `cartesian.session.js` `isHostAdmin()`, which requires
   * `session.hostId` — a field no backend configuration processor ever
   * emits — so it evaluated `false` for everyone, including a real host
   * admin. Now derived from the two session flags the backend actually
   * sends (`is_host` from TenantConfigurationProcessor, `is_admin`).
   */
  get isHostAdmin(): boolean {
    return this.isHost && this.isAdmin;
  }

  get isTenantSide(): boolean {
    return this._session.isTenantSide();
  }

  /**
   * True for an admin of a NON-host tenant.
   *
   * RPH-026: the legacy delegate meant `tenantId && isAdmin`, which is also
   * true for a host admin (the host has a tenant row like any other) — so it
   * really answered "is an admin", not "is a tenant admin". Now excludes the
   * host context, making it the complement of `isHostAdmin` among admins.
   * Existing consumers all use `isHostAdmin || isTenantAdmin` (= isAdmin),
   * which is unchanged by this fix.
   */
  get isTenantAdmin(): boolean {
    return !this.isHost && this.isAdmin;
  }

  get isUserLogged(): boolean {
    return this._session.isUserLogged();
  }
}
