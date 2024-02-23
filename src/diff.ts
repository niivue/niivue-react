import { HasUrlObject } from "./model.ts";

/**
 * A special value which indicates that the difference between two objects is Irreconcilable.
 */
const _Irreconcilable = { _reconcilable: false };

/**
 * Difference between two lists of objects.
 */
type Diff<T extends HasUrlObject> = {
  added: T[];
  removed: T[];
  changed: HasUrlObject[];
};

/**
 * Calls `diff` on all pairs in `x` and `y` which have the same `url`.
 * In case where a result of `diff` is "irreconcilable" (in the context
 * of Niivue, this means there are no functions to apply the change
 * so the data must be removed then reloaded) the URL will appear in both
 * `added` and `removed`, not `changed`.
 */
function diffList<T extends HasUrlObject>(x: T[], y: T[]): Diff<T> {
  const xUrls = x.map((v) => v.url);
  const yUrls = y.map((v) => v.url);

  const removedUrls = setDifference(xUrls, yUrls);
  const addedUrls = setDifference(yUrls, xUrls);

  const changeEntries = zipObjectsOnUrl(x, y)
    .map(([xValue, yValue]): [string, any] => [
      xValue.url,
      diff(xValue, yValue),
    ])
    .filter(isNotEmptyEntry);

  const changedEntries = changeEntries.filter(
    ([_url, diffResult]) => diffResult !== _Irreconcilable,
  );

  // if a change is considered "irreconcilable" that means we must reload the data,
  // which can be done by removing then adding.
  const mustReloadUrls = changeEntries
    .filter(([_url, diffResult]) => diffResult === _Irreconcilable)
    .map(([url, _d]) => url);

  return {
    added: y.filter((v) =>
      addedUrls.concat(mustReloadUrls).find((url) => url === v.url),
    ),
    removed: x.filter((v) =>
      removedUrls.concat(mustReloadUrls).find((url) => url === v.url),
    ),
    changed: changedEntries.map(([url, d]): HasUrlObject => {
      return { ...d, url };
    }),
  };
}

function zipObjectsOnUrl<T extends HasUrlObject>(x: T[], y: T[]): [T, T][] {
  const yMap = Object.fromEntries(y.map(toUrlEntry));
  return x.map((v): [T, T] => [v, yMap[v.url]]).filter(isNotEmptyEntry);
}

function toUrlEntry<T extends HasUrlObject>(o: T): [string, T] {
  return [o.url, o];
}

/**
 * Behaves like `diffPrimitive` but handles object values as well.
 * If `y[key]` is an `object`:
 *
 * - if `x[key]` and `y[key]` have different keys: returned value is `🎆IRRECONCILABLE`.
 * - if `x[key]` and `y[key]` have different values: call `diffPrimitive`
 */
function diff<T extends { [key: string]: any }>(x: T, y: T): any {
  const xObjects = getValuesThatAreObjects(x);
  const yObjects = getValuesThatAreObjects(y);

  // e.g. x = {}, y = {layers: {}}
  if (!objectSameKeys(xObjects, yObjects)) {
    return _Irreconcilable;
  }

  const zip = zipObjects(xObjects, yObjects);

  // e.g. x = {layers: {one: 1}}, y = {layers: {one: 1, two: 2}}
  if (
    zip.findIndex(
      ([_key, xObject, yObject]) => !objectSameKeys(xObject, yObject),
    ) !== -1
  ) {
    return _Irreconcilable;
  }

  const objectDiffEntries = zip
    .map(([outerKey, xObject, yObject]): [string, Object] => {
      const diffEntries = zipObjects(xObject, yObject)
        .map(([innerKey, xValue, yValue]): [string, any] => [
          innerKey,
          diffPrimitive(xValue, yValue),
        ])
        .filter(isNotEmptyEntry);
      return [outerKey, Object.fromEntries(diffEntries)];
    })
    .filter(isNotEmptyEntry);

  // throw Error(JSON.stringify(objectDiffEntries));

  // compute diff of primitive values
  const primitiveDiff = diffPrimitive(
    getValuesThatArePrimitives(x),
    getValuesThatArePrimitives(y),
  );

  return {
    ...Object.fromEntries(objectDiffEntries),
    ...primitiveDiff,
  };
}

function isNotEmptyEntry(t: [any, Object]): boolean {
  return t[1] && Object.keys(t[1]).length !== 0;
}

function zipObjects<X, Y>(
  x: { [key: string]: X },
  y: { [key: string]: Y },
): [string, X, Y][] {
  return Object.entries(x)
    .filter(([key, _value]) => key in y)
    .map(([key, value]) => [key, value, y[key]]);
}

function getValuesThatAreObjects(x: { [key: string]: any }): {
  [key: string]: { [key: string]: any };
} {
  return Object.fromEntries(Object.entries(x).filter(entryValueIsObject));
}

function getValuesThatArePrimitives(o: { [key: string]: any }): {
  [key: string]: any;
} {
  return Object.fromEntries(
    Object.entries(o).filter((entry) => !entryValueIsObject(entry)),
  );
}

function entryValueIsObject(o: [string, any]): boolean {
  return typeof o[1] === "object" && !Array.isArray(o[1]) && o[1] !== null;
}

function objectSameKeys(
  x: { [key: string]: any },
  y: { [key: string]: any },
): boolean {
  const xKeys = Object.keys(x);
  const yKeys = Object.keys(y);
  if (xKeys.length !== yKeys.length) {
    return false;
  }
  const notInyKeys = (xKey: string) =>
    yKeys.findIndex((yKey) => xKey === yKey) === -1;
  return xKeys.findIndex(notInyKeys) === -1;
}

/**
 * Produces an object with key-value pairs in `y` which are different
 * from their respective values in `x`, i.e. a representation of what is
 * "changed" from `x` to `y`.
 *
 * - if `x[key] === y[key]`: return value is `undefined`
 * - if `x[key] !== y[key]`: return value is `y[key]`
 * - if `x[key]` not defined: return value is `y[key]`
 * - **caveat**: if `x[key]` is defined but not `y[key]`: return value is `undefined`
 * - **caveat**: if `x[key]` is not primitive (i.e. is object or array), deep comparison is used.
 *               if `x[key]` does not deeply equal `y[key]`, then the returned object will have the
 *               value `y[key]` (_not_ the diff from `x[key]` to `y[key]`!)
 */
function diffPrimitive<T extends { [key: string]: any }>(
  x: T,
  y: T,
): { [key: string]: any } {
  const xKeys = Object.keys(x);
  const yKeys = Object.keys(y);
  const deletedKeys = setDifference(xKeys, yKeys);
  const addedKeys = setDifference(yKeys, xKeys);
  const changedKeys = xKeys.filter((key) => !deepishEqual(x[key], y[key]));
  const diffKeys = addedKeys.concat(changedKeys);
  return {
    ...Object.fromEntries(deletedKeys.map((key) => [key, undefined])),
    ...Object.fromEntries(diffKeys.map((key) => [key, y[key]])),
  };
}

/**
 * Equality for arrays and primitives.
 */
function deepishEqual<T>(x: T, y: T): boolean {
  if (Array.isArray(x)) {
    if (!Array.isArray(y)) {
      return false;
    }
    return zipArrays(x, y).reduce(
      (same, [a, b]) => same && deepishEqual(a, b),
      true,
    );
  }
  return x === y;
}

function zipArrays<X, Y>(x: X[], y: Y[]): [X, Y][] {
  return x.map((v, i) => [v, y[i]]);
}

function setDifference(x: string[], y: string[]): string[] {
  const ySet = new Set(y);
  return x.filter((k) => !ySet.has(k));
}

function noChange(d: Diff<any>): boolean {
  return d.changed.length + d.added.length + d.removed.length === 0;
}

export type { Diff };
export {
  setDifference,
  diffList,
  diff,
  diffPrimitive,
  objectSameKeys,
  noChange,
  _Irreconcilable,
};
