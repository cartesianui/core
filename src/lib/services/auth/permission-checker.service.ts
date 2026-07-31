

import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PermissionCheckerService {
  /**
   * Whether the current user holds `permissionName`.
   *
   * RPH-020/011 (roles-permission-hardening) — these three checks used to
   * delegate to `@cartesianui/js`'s `cartesian.auth.isGranted()`, which is:
   *
   *   isGranted = (name) =>
   *     (allPermissions[name] !== undefined && grantedPermissions[name] !== undefined) ||
   *     (allPermissions.indexOf(name) !== -1 && grantedPermissions.indexOf(name) !== -1);
   *
   * i.e. it required the FULL platform permission catalog (`auth.allPermissions`)
   * to be present client-side merely to answer "does this user hold X". RPH-011
   * deleted that catalog from the config bundle — it shipped ~1,553 names to
   * every user on every boot and had no consumer — after which
   * `cartesian.auth.allPermissions` falls back to `{}`, whose `.indexOf` is not
   * a function, so the second clause **throws a TypeError**.
   *
   * That break is latent today (no route sets `data.permission`, and the single
   * `*accessible` usage passes `onlyFor` roles only) but would fire on every
   * guarded route the moment RPH-035 wires them. Answering from
   * `grantedPermissions` alone is both correct and sufficient: a name the user
   * holds is necessarily a name that exists.
   */
  isGranted(permissionName: string): boolean {
    return this.getGrantedPermissions().includes(permissionName);
  }

  /** True if the user holds at least ONE of `permissions` (any-of). */
  isAnyGranted(permissions: string[]): boolean {
    if (!permissions?.length) {
      return true;
    }
    const granted = this.getGrantedPermissions();
    return permissions.some((p) => granted.includes(p));
  }

  /** True if the user holds EVERY one of `permissions` (all-of). */
  areAllGranted(permissions: string[]): boolean {
    if (!permissions?.length) {
      return true;
    }
    const granted = this.getGrantedPermissions();
    return permissions.every((p) => granted.includes(p));
  }

  /**
   * Permissions granted to the current user (directly + via roles), as the
   * flat string array the config bundle's `auth.granted_permissions` actually
   * carries (see `UserConfigurationProcessor` on the BE).
   *
   * RPH-020 (roles-permission-hardening). The wrong shape is declared
   * OUTSIDE this repo — `@cartesianui/js`'s `cartesian.d.ts` says
   * `auth.grantedPermissions: { [name: string]: boolean }`, an older
   * ABP-style map the backend never sends. Until that package is corrected,
   * the cast has to live somewhere; it lives HERE, once, behind an honest
   * signature — rather than repeated as `as unknown as string[]` at every
   * call site, which is what both nav shells previously did.
   *
   * Do NOT "fix" callers by treating the result as a map: every nav
   * permission gate would silently invert.
   */
  getGrantedPermissions(): string[] {
    return (cartesian.auth.grantedPermissions as unknown as string[]) ?? [];
  }

  /**
   * Get all assigned roles for the current user
   * @returns Array of role names
   */
  getAllAssignedRoles(): string[] {
    return cartesian.auth.assignedRoles || [];
  }

  /**
   * Check if the current user has a specific role
   * @param roleName - The role name to check
   * @returns True if the user has the role, false otherwise
   */
  hasRole(roleName: string): boolean {
    const roles = cartesian.auth.assignedRoles || [];
    return roles.includes(roleName);
  }

  /**
   * Check if the current user has any of the specified roles
   * @param roleNames - Array of role names to check
   * @returns True if the user has at least one of the roles, false otherwise
   */
  hasAnyRole(roleNames: string[]): boolean {
    const roles = cartesian.auth.assignedRoles || [];
    return roleNames.some(roleName => roles.includes(roleName));
  }

  /**
   * Check if the current user has all of the specified roles
   * @param roleNames - Array of role names to check
   * @returns True if the user has all of the roles, false otherwise
   */
  hasAllRoles(roleNames: string[]): boolean {
    const roles = cartesian.auth.assignedRoles || [];
    return roleNames.every(roleName => roles.includes(roleName));
  }
}
