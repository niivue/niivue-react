import { expect, test } from "vitest";
import {diff, diffPrimitive, diffList, setDifference} from "./diff";

test.each([
  // TODO
])("diffList(%o, %o) -> %o  // %s", (x, y, expected, _comment) => {
  expect(diffList(x, y)).toStrictEqual(expected);
});

test('diff should return {} when object not changed', () => {
  const x = {name: 'wm', layers: [{name: 'cortical thickness'}, {name: 'curvature'}]};
  const y = {name: 'wm', layers: [{name: 'cortical thickness'}, {name: 'curvature'}]};
  expect(diff(x, y)).toStrictEqual({});
})

test.each([
  [
    {name: 'wm', layers: [{name: 'cortical thickness'}, {name: 'curvature'}]},
    {name: 'wm', layers: [{name: 'curvature'}]},
    'removed layer "cortical thickness"'
  ],
  [
    {name: 'wm', layers: [{name: 'cortical thickness'}]},
    {name: 'wm', layers: [{name: 'cortical thickness'}, {name: 'curvature'}]},
    'added layer "curvature"'
  ],
  [
    {name: 'wm', layers: [{name: 'cortical thickness', visible: true}, {name: 'curvature', visible: false}]},
    {name: 'wm', layers: [{name: 'cortical thickness', visible: false}, {name: 'curvature', visible: false}]},
    'changed "visible" of first layer'
  ],
])("diff(%o, %o)  // should return second argument because %s", (x, y, _comment) => {
  expect(diff(x, y)).toBe(y);
});

const DIFF_PRIMITIVE_TEST_CASES = [
  [{}, {}, {}, 'empty'],
  [{flavor: 'salty'}, {flavor: 'salty'}, {}, 'no change'],
  [{flavor: 'salty'}, {}, {flavor: undefined}, 'deleted "flavor"'],
  [{flavor: 'salty'}, {flavor: 'sweet'}, {flavor: 'sweet'}, 'changed "flavor"'],
  [{flavor: 'salty'}, {flavor: 'salty', pH: 6.2}, {pH: 6.2}, 'added "pH"'],
  [{flavor: 'salty', pH: 6.2}, {flavor: 'sweet', sauce: 'bbq'}, {flavor: 'sweet', sauce: 'bbq', pH: undefined}, 'changed "flavor", added "sauce", removed "pH"'],
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
