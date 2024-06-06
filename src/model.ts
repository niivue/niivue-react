import { ColorMap, NiiVueOptions } from "./reexport";
import { NVImage, NVMeshFromUrlOptions } from "@niivue/niivue";
// noinspection ES6UnusedImports: used for TSDoc
import { FreeSurferColorLUT } from "./colormaps";

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
type NVRMesh = { url: string; layers: NVRMeshLayer[] } & Pick<
  Partial<NVMeshFromUrlOptions>,
  "name" | "opacity" | "visible" | "rgba255" | "colorbarVisible"
>;

/**
 * Options of a volume which are directly compatible with `ImageFromUrlOptions` and `NVImage`, meaning:
 *
 * - properties are supported by {@link Niivue.loadVolumes}
 * - properties can be changed by mutating {@link Niivue.volumes}
 */
type LoadableVolumeOptions = Pick<
  Partial<NVImage>,
  | "name"
  | "opacity"
  | "colormap"
  | "colormapNegative"
  | "cal_min"
  | "cal_max"
  | "trustCalMinMax"
  | "colorbarVisible"
>;

/**
 * Options of a volume which are directly compatible with {@link NVImage}.
 */
type ImageOptions = LoadableVolumeOptions &
  Pick<Partial<NVImage>, "modulateAlpha">;

/**
 * Special options of a volume which are supported handled differently in `niivue-react` and Niivue,
 * for the sake of ergonomics.
 */
type SpecialVolumeOptions = {
  /**
   * Another loaded image which modulates this one. See {@link Niivue.setModulationImage}
   *
   * https://github.com/niivue/niivue/blob/4dd7e2b946cdf384e88f76f61657a0ef1531f978/src/niivue/index.ts#L5893-L5914
   */
  modulationImageUrl?: string | null;

  /**
   * Color map for a volume which represents labels (segmentation).
   * See {@link NVImage.setColormapLabel}
   *
   * Example value: {@link FreeSurferColorLUT}
   */
  colormapLabel?: ColorMap | null;
};

/**
 * Volume options supported by `niivue-react`.
 */
type NVRVolumeOptions = ImageOptions & SpecialVolumeOptions;

/**
 * A volume (e.g. t2 MRI) in NiiVue.
 */
type NVRVolume = NVRVolumeOptions & {
  url: string;
};

/**
 * Niivue configurations.
 *
 * This is a union of [`NiivueOptions`](https://github.com/niivue/niivue/blob/9fa221344a6f39315574efa4ef4c6e9da930de57/src/niivue/index.ts#L241-L327)
 * and a subset of the fields of [`Niivue`](https://github.com/niivue/niivue/blob/9fa221344a6f39315574efa4ef4c6e9da930de57/src/niivue/index.ts#L381-L441).
 */
type NVROptions = NiiVueOptions & {
  textHeight?: number;
  colorbarHeight?: number;

  // nv.* fields
  overlayOutlineWidth?: number;

  // not safe to configure by setting nv.opts.* directly, must use setter methods
  crosshairColor?: number[];
  crosshairWidth?: number;
  volScaleMultiplier?: number;
};

export type {
  NVRMesh,
  NVRMeshLayer,
  NVRVolume,
  LoadableVolumeOptions,
  ImageOptions,
  SpecialVolumeOptions,
  NVRVolumeOptions,
  NVROptions,
  HasUrlObject,
};
