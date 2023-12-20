import { SLICE_TYPE } from "@niivue/niivue";

type HasUrlObject = { [key: string]: any; url: string };

/**
 * A surface overlay (e.g. cortical thickness) in Niivue.
 */
type NVRMeshLayer = {
  url: string;
  name?: string;
  opacity?: number;
  colormap?: string;
  colormapNegative?: string;
  useNegativeCmap?: boolean;
  global_min?: number;
  global_max?: number;
  cal_min?: number;
  cal_max?: number;
};

/**
 * A mesh (e.g. white-matter surface) in Niivue.
 */
type NVRMesh = {
  url: string;
  name?: string;
  opacity?: number;
  visible?: boolean;
  rgba255?: number[];
  /**
   * Map keys must be some kind of unique ID. For example, given `NVRMeshLayer[]`:
   *
   * ```typescript
   * (layers: NVRMeshLayer[]) => Object.fromEntries(layers.map((layer) => [layer.url, layer]))
   * ```
   */
  layers?: { [key: string]: NVRMeshLayer };
  colorbarVisible?: boolean;
};

/**
 * A volume (e.g. t2 MRI) in NiiVue.
 */
type NVRVolume = {
  url: string;
  opacity?: number;
  colormap?: string;
  colormapNegative?: string;
  cal_min?: number;
  cal_max?: number;
  trustCalMinMax?: boolean;
  visible?: boolean;
  colorbarVisible?: boolean;

  /**
   * Another loaded image which modulates this one.
   */
  modulationImageUrl?: string | null;
  modulateAlpha?: number;
};

/**
 * Niivue configurations.
 *
 * This is a subset of what is configurable via `nv.opts` U `nv`.
 * There is some overlap with the options of
 * [`NiiVueOptions`](https://github.com/niivue/niivue/blob/41b134123870fb0b69540a2d8155e75ec8e06339/src/niivue/index.ts#L239-L242),
 * though some variable names are different.
 */
type NVROptions = {
  // nv.opts.* fields
  isColorbar?: boolean;
  isOrientCube?: boolean;
  isHighResolutionCapable?: boolean;
  meshThicknessOn2D?: number;
  sliceType?: SLICE_TYPE;
  isSliceMM?: boolean;
  backColor?: number[];
  isNearestInterpolation?: boolean;
  multiplanarForceRender?: boolean;

  // nv.* fields
  overlayOutlineWidth?: number;
};

/**
 * Converts to `LoadFromUrlParams` (which is not exported by niivue).
 */
function canonicalizeNvrMesh(mesh: NVRMesh): HasUrlObject {
  if (mesh.layers) {
    return {
      ...mesh,
      layers: Object.values(mesh.layers),
    };
  }
  return mesh;
}

export type { NVRMesh, NVRMeshLayer, NVRVolume, NVROptions, HasUrlObject };
export { canonicalizeNvrMesh };
