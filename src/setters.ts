/**
 * Helper functions for associating property names to setter methods.
 */
import { NVROptions, ImageOptions } from "./model.ts";
import { Niivue } from "@niivue/niivue";

type OptionUpdateFunctionMap = {
  [key in keyof NVROptions]: (value: any) => void;
};

/**
 * Creates associations between property names and Niivue setter methods.
 */
function optionUpdateFunctionMap(nv: Niivue): OptionUpdateFunctionMap {
  const mapping = {
    crosshairWidth: nv.setCrosshairWidth,
    crosshairColor: nv.setCrosshairColor,
    sliceType: nv.setSliceType,
    isSliceMM: nv.setSliceMM,
  };
  return bindAllValues(nv, mapping);
}

type VolumeUpdateFunctionByIndexMap = {
  [key in keyof ImageOptions]: (index: number, value: any) => void;
};

/**
 * Creates associations between volume property names and Niivue setter methods
 * which identify volumes by list index number.
 */
function volumeUpdateFunctionByIndexMap(
  nv: Niivue,
): VolumeUpdateFunctionByIndexMap {
  const mapping = {
    opacity: nv.setOpacity,
  };
  return bindAllValues(nv, mapping);
}

type VolumeUpdateFunctionByIdMap = {
  [key in keyof ImageOptions]: (id: string, value: any) => void;
};

/**
 * Creates associations between volume property names and Niivue setter methods
 * which identify volumes by volume UUID string.
 */
function volumeUpdateFunctionByIdMap(nv: Niivue): VolumeUpdateFunctionByIdMap {
  const mapping = {
    colormap: nv.setColormap,
    colormapNegative: nv.setColormapNegative,
  };
  return bindAllValues(nv, mapping);
}

function bindAllValues<N, M extends object>(nv: N, mapping: M): M {
  const binded = Object.entries(mapping).map(([k, v]) => [k, v.bind(nv)]);
  return Object.fromEntries(binded);
}

export type {
  OptionUpdateFunctionMap,
  VolumeUpdateFunctionByIndexMap,
  VolumeUpdateFunctionByIdMap,
};
export {
  optionUpdateFunctionMap,
  volumeUpdateFunctionByIndexMap,
  volumeUpdateFunctionByIdMap,
};
