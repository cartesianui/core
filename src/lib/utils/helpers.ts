import { Observable } from 'rxjs';

let typeCache: { [label: string]: boolean } = {};

type Predicate = (oldValues: Array<any>, newValues: Array<any>) => boolean;

/**
 * This function coerces a string into a string literal type.
 * Using tagged union types in TypeScript 2.0, this enables
 * powerful typechecking of our reducers.
 *
 * Since every action label passes through this function it
 * is a good place to ensure all of our action labels are unique.
 *
 * @param label
 */
export function type<T>(label: T | ''): T {
  if (typeCache[<string>label]) {
    throw new Error(`Action type "${label}" is not unqiue"`);
  }

  typeCache[<string>label] = true;

  return <T>label;
}

/**
 * Runs through every condition, compares new and old values and returns true/false depends on condition state.
 * This is used to distinct if two observable values have changed.
 *
 * @param oldValues
 * @param newValues
 * @param conditions
 */
export function distinctChanges(oldValues: Array<any>, newValues: Array<any>, conditions: Predicate[]): boolean {
  if (conditions.every((cond) => cond(oldValues, newValues))) return false;
  return true;
}

/**
 * Returns true if the given value is type of Object
 *
 * @param val
 */
export function isObject(val: any) {
  if (val === null) return false;

  return typeof val === 'function' || typeof val === 'object';
}

/**
 * Returns true if the given value is type of Array
 *
 * @param val
 */
export function isArray(a) {
  return Array.isArray(a);
}

/**
 * Returns true if the given value is type of string
 *
 * @param val
 */
export function isString(x: any): x is string {
  return typeof x === 'string';
}

/**
 * Returns converted string (from snake to camel)
 *
 * @param val
 */
export function toCamel(s) {
  return s.replace(/([-_][a-z0-9])/gi, ($1) => {
    return $1.toUpperCase().replace('-', '').replace('_', '');
  });
}

/**
 * Returns converted string (from snake to camel)
 *
 * @param val
 */
export function toSnake(s) {
  return s.replace(/[A-Z]/g, (letter) => {
    return `_${letter?.toLowerCase()}`;
  });
}

/**
 * Returns converted object (keys converted from snake to camel)
 *
 * @param val
 */
export function convertObjectKeysToCamel(o) {
  if (isArray(o)) {
    return o.map((i) => {
      return convertObjectKeysToCamel(i);
    });
  } else if (isObject(o)) {
    const n = {};
    Object.keys(o).forEach((k) => {
      n[toCamel(k)] = convertObjectKeysToCamel(o[k]);
    });
    return n;
  }
  return o;
}

/**
 * Recursively strip Fractal `{ data: ... }` envelopes from API responses.
 *
 * Apiato / League\Fractal wraps included relations as `{ "data": { ... } }`
 * (single item) or `{ "data": [ ... ] }` (collection). For consumers that
 * walk the tree to read nested values, having to remember the extra `data`
 * hop at every relation boundary is fragile (see SelectableControlComponent
 * + RN-item edit gate: `skuSelected().product.data.configuration.shopifier.hasBatches`
 * vs the cleaner `skuSelected().product.configuration.shopifier.hasBatches`).
 *
 * This helper unwraps every node where the ONLY key is `data` and that
 * key's value is an object or array — same rule the BE
 * `LookupResponseMiddleware::unwrapFractal` applies on lookup-mode
 * responses. Apply this on FE consumption paths that DON'T go through
 * lookup-mode (e.g. find-by-id, find-by-criteria) so the post-conversion
 * shape is consistent with lookup responses.
 *
 * Safe to call multiple times — re-walks idempotently.
 */
export function unwrapFractalData(o: any): any {
  if (isArray(o)) {
    return o.map((i) => unwrapFractalData(i));
  }
  if (isObject(o)) {
    // Collapse the envelope: a node `{ data: <something> }` where `data`
    // is the sole key becomes whatever's inside. Recurse into the result.
    const keys = Object.keys(o);
    if (keys.length === 1 && keys[0] === 'data' && (isObject(o['data']) || isArray(o['data']))) {
      return unwrapFractalData(o['data']);
    }
    const n: any = {};
    keys.forEach((k) => {
      n[k] = unwrapFractalData(o[k]);
    });
    return n;
  }
  return o;
}

/**
 * Returns converted object (keys converted from camel to snake)
 *
 * @param val
 */
export function convertObjectKeysToSnake(o) {
  if (isArray(o)) {
    return o.map((i) => {
      return convertObjectKeysToSnake(i);
    });
  } else if (isObject(o)) {
    const n = {};
    Object.keys(o).forEach((k) => {
      n[toSnake(k)] = convertObjectKeysToSnake(o[k]);
    });
    return n;
  }
  return o;
}

/**
 * Capitalizes the first character in given string
 *
 * @param s
 */
export function capitalize(s: string) {
  if (!s || typeof s !== 'string') return s;
  return s && s[0].toUpperCase() + s.slice(1);
}

/**
 * Uncapitalizes the first character in given string
 *
 * @param s
 */
export function uncapitalize(s: string) {
  if (!s || typeof s !== 'string') return s;
  return s && s[0]?.toLowerCase() + s.slice(1);
}

/**
 * Flattens multi dimensional object into one level deep
 *
 * @param obj
 * @param preservePath
 */
export function flattenObject(ob: any, preservePath: boolean = false): any {
  var toReturn = {};

  for (var i in ob) {
    if (!ob.hasOwnProperty(i)) continue;

    if (typeof ob[i] == 'object') {
      var flatObject = flattenObject(ob[i], preservePath);
      for (var x in flatObject) {
        if (!flatObject.hasOwnProperty(x)) continue;

        let path = preservePath ? i + '.' + x : x;

        toReturn[path] = flatObject[x];
      }
    } else toReturn[i] = ob[i];
  }

  return toReturn;
}

/**
 * Returns formated date based on given culture
 *
 * @param dateString
 * @param culture
 */
export function localeDateString(dateString: string, culture: string = 'en-EN'): string {
  let date = new Date(dateString);
  return date.toLocaleDateString(culture);
}

export function extractContent(content: any): Observable<string> {
  return new Observable<string>((observer: any) => {
    if (!content) {
      observer.next('');
      observer.complete();
    } else if (content instanceof Blob) {
      let reader = new FileReader();
      reader.onload = function () {
        observer.next(this.result);
        observer.complete();
      };
      reader.readAsText(content);
    } else {
      if (typeof content === 'string') {
        observer.next(JSON.stringify({ message: content }));
        observer.complete();
      } else if (typeof content === 'object') {
        observer.next(JSON.stringify(content));
        observer.complete();
      }
    }
  });
}
