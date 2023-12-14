import deepEqual from 'deep-equal';

type HasUrlObject = {[key: string]: any, url: string};

/**
 * Difference between two lists of objects.
 */
type Diff<T extends HasUrlObject> = {
  added: T[],
  removed: T[],
  changed: HasUrlObject[]
}

function diffList<T extends HasUrlObject>(x: T[], y: T[]): Diff<T> {
  const xUrls = x.map(v => v.url);
  const yUrls = y.map(v => v.url);

  const addedUrls = setDifference(xUrls, yUrls);
  const removedUrls = setDifference(yUrls, xUrls);

  const changes = zipObjectsOnUrl(x, y)
    .map(([xValue, yValue]): [string, any] => [xValue.url, diff(xValue, yValue)])
    .filter(([url, d]) => !!d)
    .map(([url, d]): HasUrlObject => {return {...d, url}});

  return {
    added: y.filter((v) => addedUrls.find((url) => url === v.url)),
    removed: x.filter((v) => removedUrls.find((url) => url === v.url)),
    changed: changes
  };

}

function zipObjectsOnUrl<T extends HasUrlObject>(x: T[], y: T[]): [T, T][] {
  const yMap = Object.fromEntries(y.map(toUrlEntry));
  return x.map(v => [v, yMap[v.url]]);
}

function toUrlEntry<T extends HasUrlObject>(x: T): [string, T] {
  return [x.url, x]
}

/**
 * Behaves like `diffPrimitive` but adds logic for object and array type values: deep comparison is used.
 * If `x[key]` does not deeply equal `y[key]`, then the entire returned object will be `y`.
 */
function diff<T extends {[key: string]: any}>(x: T, y: T): any {
  const xObjects = getValuesThatAreObjects(x);
  const yObjects = getValuesThatAreObjects(y);
  if (!deepEqual(xObjects, yObjects)) {
    return y;
  }
  return diffPrimitive(
    getValuesThatArePrimitives(x),
    getValuesThatArePrimitives(y)
  );
}

function getValuesThatAreObjects(x: {[key: string]: any}): {[key: string]: any} {
  return Object.fromEntries(Object.entries(x).filter(entryNeedsDeepEquality));
}

function getValuesThatArePrimitives(x: {[key: string]: any}): {[key: string]: any} {
  return Object.fromEntries(Object.entries(x).filter((entry) => !entryNeedsDeepEquality(entry)));
}

function entryNeedsDeepEquality(x: [string, any]): boolean {
  return typeof x[1] === 'object';
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
function diffPrimitive<T extends {[key: string]: any}>(x: T, y: T): any {
  const xKeys = Object.keys(x);
  const yKeys = Object.keys(y);
  const deletedKeys = setDifference(xKeys, yKeys);
  const addedKeys = setDifference(yKeys, xKeys);
  const changedKeys = xKeys.filter((key) => x[key] !== y[key]);
  const diffKeys = addedKeys.concat(changedKeys);
  return {
    ...Object.fromEntries(deletedKeys.map((key) => [key, undefined])),
    ...Object.fromEntries(diffKeys.map((key) => [key, y[key]]))
  };
}

function setDifference(x: string[], y: string[]): string[] {
  const ySet = new Set(y);
  return x.filter((k) => !ySet.has(k));
}

export {setDifference, diffList, diff, diffPrimitive };
