

import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class PermissionCheckerService {
  isGranted(permissionName: string): boolean {
    return cartesian.auth.isGranted(permissionName);
  }

  isAnyGranted(permissions: string[]): boolean {
    return cartesian.auth.isAnyGranted(...permissions);
  }

  areAllGranted(permissions: string[]): boolean {
    return cartesian.auth.areAllGranted(...permissions);
  }

  getAllPermissions(): {[name: string]: boolean} {
    return cartesian.auth.allPermissions;
  }

  getGrantedPermissions(): {[name: string]: boolean} {
    return cartesian.auth.grantedPermissions;
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
