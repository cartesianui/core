import { InjectionToken } from '@angular/core';

/**
 * A unit that contributes headers to every outgoing request through the
 * CartesianHttpInterceptor. Feature libs register one via
 * `HTTP_HEADER_CONTRIBUTORS` so the platform interceptor stays free of any
 * domain knowledge — the same inversion the shell uses for header buttons
 * (`HeaderActionsService`).
 *
 * Unlike `AppConfig.interceptor.headers` (a static map set at boot), a
 * contributor is read on every request, so it can carry values that change at
 * runtime (e.g. a per-request scope/context id).
 */
export interface HttpHeaderContributor {
  /**
   * Headers to merge onto the outgoing request. Null/empty values are skipped
   * and a header already present on the request is never overwritten.
   */
  headers(): Record<string, string | null | undefined>;
}

/** Multi-provider token of header contributors consulted by the interceptor. */
export const HTTP_HEADER_CONTRIBUTORS = new InjectionToken<HttpHeaderContributor[]>(
  'HTTP_HEADER_CONTRIBUTORS'
);
