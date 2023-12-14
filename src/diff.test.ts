import { expect, test } from "vitest";
import {diff, diffPrimitive, diffList, setDifference, objectSameKeys, IRRECONCILABLE} from "./diff";

// test.each([
//   // TODO
// ])("diffList(%o, %o) -> %o  // %s", (x, y, expected, _comment) => {
//   expect(diffList(x, y)).toStrictEqual(expected);
// });


test('diff should return {} when object not changed', () => {
  const layers = {thickness: {url: 'https://example.com/cortical_thickness.mz3'}, curvature: {url: 'https://example.com/curvature.mz3'}};
  const x = {name: 'wm', layers};
  const y = {name: 'wm', layers};
  expect(diff(x, y)).toStrictEqual({});
});

test.each([
  [
    {name: 'wm', layers: {thickness: {url: 'https://example.com/cortical_thickness.mz3'}, curvature: {url: 'https://example.com/curvature.mz3'}}},
    {name: 'wm', layers: {curvature: {url: 'https://example.com/curvature.mz3'}}},
    'removed layer "thickness"'
  ],
  [
    {name: 'wm', layers: {thickness: {url: 'https://example.com/cortical_thickness.mz3'}}},
    {name: 'wm', layers: {thickness: {url: 'https://example.com/cortical_thickness.mz3'}, curvature: {url: 'https://example.com/curvature.mz3'}}},
    'added layer "curvature"'
  ],
  [
    {name: 'wm', layers: {thickness: {url: 'https://example.com/cortical_thickness.mz3'}, curvature: {url: 'https://example.com/curvature.mz3'}}},
    {name: 'wm', },
    'removed all layers'
  ],
  [
    {name: 'wm', },
    {name: 'wm', layers: {thickness: {url: 'https://example.com/cortical_thickness.mz3'}, curvature: {url: 'https://example.com/curvature.mz3'}}},
    'Added layers'
  ],
])("diff(%o, %o)  // should be IRRECONCILABLE because %s", (x: object, y: object, _comment) => {
  expect(diff(x, y)).toBe(IRRECONCILABLE);
});

test.each([
  [
    {name: 'wm', layers: {thickness: {url: 'https://example.com/cortical_thickness.mz3', colorbarVisible: true}, curvature: {url: 'https://example.com/curvature.mz3', colorbarVisible: true}}},
    {name: 'wm', layers: {thickness: {url: 'https://example.com/cortical_thickness.mz3', colorbarVisible: true}, curvature: {url: 'https://example.com/curvature.mz3', colorbarVisible: false}}},
    {layers: {curvature: {colorbarVisible: false}}},
    'changed "colorbarVisible" of "curvature" layer'
  ],
])("diff(%o, %o)  // should return changed properties of layers", (x: object, y: object, expected: object, _comment) => {
  expect(diff(x, y)).toStrictEqual(expected);
});

const COLORS = {
  Red: [255, 0, 0, 1.0],
  Yellow: [255, 165, 0, 1.0]
}

const DIFF_PRIMITIVE_TEST_CASES = [
  [{}, {}, {}, 'empty'],
  [{flavor: 'salty'}, {flavor: 'salty'}, {}, 'no change'],
  [{flavor: 'salty'}, {}, {flavor: undefined}, 'deleted "flavor"'],
  [{flavor: 'salty'}, {flavor: 'sweet'}, {flavor: 'sweet'}, 'changed "flavor"'],
  [{flavor: 'salty'}, {flavor: 'salty', pH: 6.2}, {pH: 6.2}, 'added "pH"'],
  [{flavor: 'salty', pH: 6.2}, {flavor: 'sweet', sauce: 'bbq'}, {flavor: 'sweet', sauce: 'bbq', pH: undefined}, 'changed "flavor", added "sauce", removed "pH"'],
  [{type: 'paint', color: COLORS.Red}, {type: 'paint', color: COLORS.Red}, {}, 'no change (same array ref)'],
  [{type: 'paint', color: COLORS.Red}, {type: 'paint', color: COLORS.Yellow}, {color: COLORS.Yellow}, 'changed "color"'],
  [{type: 'paint', color: COLORS.Red}, {type: 'paint'}, {color: undefined}, 'removed "color"'],
  [{type: 'paint'}, {type: 'paint', color: COLORS.Yellow}, {color: COLORS.Yellow}, 'added "color"'],
];
test.each(DIFF_PRIMITIVE_TEST_CASES)("diffPrimitive(%o, %o) -> %o  // %s", (x, y, expected, _comment) => {
  expect(diffPrimitive(x, y)).toStrictEqual(expected);
});

test.each([
  [['a', 'b', 'c'], ['a', 'b', 'c'], []],
  [['a', 'b', 'c'], ['a', 'b', ], ['c']],
  [['b', 'c', 'a'], ['a', 'b', ], ['c']],
  [['a', 'b', 'c'], ['a'], ['b', 'c']],
  [['a', 'b'], ['a', 'b', 'c'], []],
  [['a', 'b'], ['a', 'c'], ['b']],
])("setDifference(%o, %o) -> %o", (x, y, expected) => {
  expect(setDifference(x, y)).toStrictEqual(expected);
});

test.each([
  [{a: 'apple', b: 'bear'}, {a: 'apple', b: 'bear'}, true],
  [{a: 'apple', b: 'bear'}, {b: 'bear', a: 'apple'}, true],
  [{a: 'apple', c: 'bear'}, {b: 'bear', a: 'apple'}, false],
  [{a: 'apple', b: 'bear'}, {b: 'bear', a: 'apple', c: 'cranberry'}, false],
  [{a: 'apple', b: 'bear', c: 'cranberry'}, {b: 'bear', a: 'apple'}, false],
])("objectSameKeys(%o, %o) -> %o", (x, y, expected) => {
  expect(objectSameKeys(x, y)).toBe(expected);
});

