import {SLICE_TYPE} from "@niivue/niivue";

/**
 * A surface overlay (e.g. cortical thickness) in Niivue.
 */
type NVRMeshLayer = {
  url: string,
  name?: string,
  opacity?: number,
  colormap?: string,
  colormapNegative?: string,
  useNegativeCmap?: boolean
  global_min?: number
  global_max?: number
  cal_min?: number
  cal_max?: number
}

/**
 * A mesh (e.g. white-matter surface) in Niivue.
 */
type NVRMesh = {
  url: string,
  name?: string,
  opacity?: number,
  visible?: boolean,
  layers: NVRMeshLayer[],
  colorbarVisible?: boolean
};

/**
 * A volume (e.g. t2 MRI) in NiiVue.
 */
type NVRVolume = {
  url: string,
  opacity?: boolean,
  colormap?: string,
  colormapNegative?: string,
  cal_min?: number,
  cal_max?: number,
  trustCalMinMax?: boolean,
  visible?: boolean,
  colorbarVisible?: boolean
};

/**
 * Niivue configurations.
 */
type NVRConfig = {
  isOrientCube?: boolean,
  highResolutionCapable?: boolean,
  meshThicknessOn2D?: number,
  sliceType?: number,
  sliceMM?: SLICE_TYPE
};

export type {NVRMesh, NVRVolume, NVRConfig};
