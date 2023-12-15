import { expect, test } from "vitest";
import {diff, diffPrimitive, diffList, setDifference, objectSameKeys, _Irreconcilable} from "./diff";

test('diffList', () => {
  const before = {
    wmLeft: { url: 'https://example.com/lh.wm.mz3', opacity: 0.5, layers: {thickness: {url: 'https://example.com/lh.cortical_thickness.mz3'}, curvature: {url: 'https://example.com/lh.wm.curvature.mz3'}} },
    wmRight: { url: 'https://example.com/rh.wm.mz3', opacity: 0.5, layers: {thickness: {url: 'https://example.com/rh.cortical_thickness.mz3'}, curvature: {url: 'https://example.com/rh.wm.curvature.mz3'}} },
    gm: { url: 'https://example.com/gm.mz3', opacity: 0.5, layers: {curvature: {url: 'https://example.com/gm.curvature.mz3'}} },
    pial: { url: 'https://example.com/pial.mz3', opacity: 0.0, layers: {curvature: {url: 'https://example.com/pial.curvature.mz3'}}},
    hippo: { url: 'https://example.com/hippocampus.mz3', opacity: 1.0, visible: true },
    pons: {url: 'https://example.com/pons.mz3'}
  };

  const after = {
    // set opacity of curvature to 0
    wmLeft: {
      url: 'https://example.com/lh.wm.mz3',
      opacity: 0.5,
      layers: {thickness: {url: 'https://example.com/lh.cortical_thickness.mz3'}, curvature: {url: 'https://example.com/lh.wm.curvature.mz3', opacity: 0.0}}
    },
    // not changed
    wmRight: { url: 'https://example.com/rh.wm.mz3', opacity: 0.5, layers: {thickness: {url: 'https://example.com/rh.cortical_thickness.mz3'}, curvature: {url: 'https://example.com/rh.wm.curvature.mz3'}} },
    // added another layer
    gm: { url: 'https://example.com/gm.mz3', opacity: 0.5, layers: {curvature: {url: 'https://example.com/gm.curvature.mz3'}, sulcal_depth: {url: 'https://example.com/sulcal_depth.mz3', colormap: 'jet'}} },
    // added property "visible: false" and deleted property "opacity"
    pial: { url: 'https://example.com/pial.mz3', layers: {curvature: {url: 'https://example.com/pial.curvature.mz3'}}, visible: false },
    // changed property "visible: false"
    hippo: { url: 'https://example.com/hippocampus.mz3', opacity: 1.0, visible: false },
    // new object
    stem: {url: 'https://example.com/brainstem.mz3'}
    // deleted pons
  };

  const expectedChanged = [
    {
      url: 'https://example.com/lh.wm.mz3',
      layers: {curvature: {opacity: 0.0}}
    },
    {
      url: 'https://example.com/pial.mz3',
      visible: false,
      opacity: undefined,
    },
    {
      url: 'https://example.com/hippocampus.mz3',
      visible: false
    }
  ];
  const actual = diffList(Object.values(before), Object.values(after));

  // gm must be reloaded because a layer was added, so it is added and removed
  expect(actual.added).toContain(after.gm);
  expect(actual.removed).toContain(before.gm);

  expect(actual.added).toContain(after.stem);
  expect(actual.removed).toContain(before.pons);
  expect(actual.added).toHaveLength(2);
  expect(actual.removed).toHaveLength(2);

  expectedChanged.forEach((expected) => expect(actual.changed).toContainEqual(expected));
  actual.changed.forEach((actual) => expect(expectedChanged))
});

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
  expect(diff(x, y)).toBe(_Irreconcilable);
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
