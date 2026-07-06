import { HttpService, MediaType } from './http.service';
import { methodBuilder, paramBuilder } from './utils';

/* *********************************************
 * Class decorators
 * *********************************************/

/**
 * Set the base URL of REST resource
 * @param {String} url - base URL
 */
export function BaseUrl(url: string) {
  return function <TFunction extends Function>(Target: TFunction): TFunction {
    Target.prototype.getBaseUrl = () => url;
    return Target;
  };
}

/**
 * Set default headers for every method of the HttpService
 * @param {Object} headers - deafult headers in a key-value pair
 */
export function DefaultHeaders(headers: any) {
  return function <TFunction extends Function>(Target: TFunction): TFunction {
    Target.prototype.getDefaultHeaders = () => headers;
    return Target;
  };
}

/* *********************************************
 * Method decorators
 * *********************************************/

/**
 * GET method
 * @param {string} url - resource url of the method
 * @param {string} key - endpoint key as defined, only used when url is null
 */
export var GET = methodBuilder('GET');
/**
 * POST method
 * @param {string} url - resource url of the method
 * @param {string} key - endpoint key as defined, only used when url is null
 */
export var POST = methodBuilder('POST');
/**
 * PUT method
 * @param {string} url - resource url of the method
 * @param {string} key - endpoint key as defined, only used when url is null
 */
export var PUT = methodBuilder('PUT');
/**
 * PATCH method
 * @param {string} url - resource url of the method
 * @param {string} key - endpoint key as defined, only used when url is null
 */
export var PATCH = methodBuilder('PATCH');
/**
 * DELETE method
 * @param {string} url - resource url of the method
 * @param {string} key - endpoint key as defined, only used when url is null
 */
export var DELETE = methodBuilder('DELETE');
/**
 * HEAD method
 * @param {string} url - resource url of the method
 * @param {string} key - endpoint key as defined, only used when url is null
 */
export var HEAD = methodBuilder('HEAD');

/**
 * Set custom headers for a REST method
 * @param {Object} headersDef - custom headers in a key-value pair
 */
export function Headers(headersDef: any) {
  return function (target: HttpService, propertyKey: string, descriptor: any) {
    descriptor.headers = headersDef;
    return descriptor;
  };
}

/**
 * Defines the media type(s) that the methods can produce
 * @param MediaType producesDef - MediaType to be sent
 */
export function Produces(producesDef: MediaType) {
  return function (target: HttpService, propertyKey: string, descriptor: any) {
    descriptor.isJSON = producesDef === MediaType.JSON;
    descriptor.isFormData = producesDef === MediaType.FORM_DATA;
    return descriptor;
  };
}

/**
 * Defines the adatper function to modify the API response suitable for the app
 * @param TFunction adapterFn - function to be called
 */
export function Adapter(adapterFn: Function) {
  return function (target: HttpService, propertyKey: string, descriptor: any) {
    descriptor.adapter = adapterFn || null;
    return descriptor;
  };
}

/**
 * Marks the response as a blob (for PDFs, images, etc.)
 * Bypasses JSON parsing and adapter
 */
export function BlobResponse() {
  return function (target: HttpService, propertyKey: string, descriptor: any) {
    descriptor.isBlobResponse = true;
    return descriptor;
  };
}

/**
 * Marks the method as a streaming endpoint. The returned Observable emits the
 * cumulative response text as it arrives (Angular download-progress events),
 * then the final body — reusing the normal auth/tenant interceptors + base URL
 * (no fetch). Bypasses JSON parsing + the response key-adapter, so the consumer
 * parses chunks itself (e.g. NDJSON/SSE). Backward compatible: only affects
 * methods that opt in with @Stream().
 */
export function Stream() {
  return function (target: HttpService, propertyKey: string, descriptor: any) {
    descriptor.isStream = true;
    return descriptor;
  };
}

/* *********************************************
 * Parameter decorators
 * *********************************************/

/**
 * Path variable of a method's url, type: string
 * @param {string} key - path key to bind value
 */
export const Path = paramBuilder('Path');
/**
 * Query value of a method's url, type: string
 * @param {string} key - query key to bind value
 */
export var Query = paramBuilder('Query');
/**
 * Request Criteria of a REST method, type: key-value pair object
 * Only one criteria per method!
 */
export var Criteria = paramBuilder('Criteria')('Criteria');
/**
 * Body of a REST method, type: key-value pair object
 * Only one body per method!
 */
export var Body = paramBuilder('Body')('Body');
/**
 * Custom header of a REST method, type: string
 * @param {string} key - header key to bind value
 */
export var Header = paramBuilder('Header');
