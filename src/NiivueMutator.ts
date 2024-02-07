import { Niivue, NVImage } from "@niivue/niivue";
import {
  NVRVolume,
  LoadableVolumeOptions,
  ImageOptions,
  NVROptions,
  NVRMesh,
  HasUrlObject,
} from "./model.ts";
import * as setters from "./setters.ts";

/**
 * Provides helper functions to mutate the Niivue instance.
 */
class NiivueMutator {
  private readonly nv: Niivue;
  private readonly volumeUpdateFunctionByIndexMap: setters.VolumeUpdateFunctionByIndexMap;
  private readonly volumeUpdateFunctionByIdMap: setters.VolumeUpdateFunctionByIdMap;
  private readonly optionUpdateFunctionMap: setters.OptionUpdateFunctionMap;

  constructor(nv: Niivue) {
    this.nv = nv;
    this.volumeUpdateFunctionByIndexMap =
      setters.volumeUpdateFunctionByIndexMap(nv);
    this.volumeUpdateFunctionByIdMap = setters.volumeUpdateFunctionByIdMap(nv);
    this.optionUpdateFunctionMap = setters.optionUpdateFunctionMap(nv);
  }

  /**
   * Check whether the WebGL context is ready. This method must return `true` before
   * any other method of this object is called.
   */
  public glIsReady(): boolean {
    try {
      return !!this.nv.gl;
    } catch (_e: any) {
      return false;
    }
  }

  /**
   * Change Niivue options.
   */
  public applyOptions(options: NVROptions) {
    let needGLVolumeUpdate = false;
    Object.entries(options)
      // some TypeScript BS
      .map(<T>([k, v]: [string, T]): [keyof NVROptions, T] => [
        k as keyof NVROptions,
        v,
      ])
      .forEach(([key, value]) => {
        /*
         * Some options have setter methods, some options don't.
         *
         * 1. If a setter method is known, then use the setter method.
         * 2. If a property can be set on nv.opts.*, set that, then call nv.updateGLVolume()
         * 3. If a property can be set on nv.*, set that, then call nv.updateGLVolume()
         */
        const setter = this.optionUpdateFunctionMap[key];
        if (setter !== undefined) {
          setter(value);
        } else if (key in this.nv.opts) {
          // @ts-ignore
          this.nv.opts[key] = value;
          needGLVolumeUpdate = true;
        } else if (key in this.nv) {
          // @ts-ignore
          this.nv[key] = value;
          needGLVolumeUpdate = true;
        } else {
          console.warn(
            `Don't know how to handle ${key}=${JSON.stringify(value)}`,
          );
        }
      });
    if (needGLVolumeUpdate) {
      this.nv.updateGLVolume();
    }
  }

  /**
   * A wrapper for `Niivue.loadVolumes` which also handles bugs.
   * N.B.: `Niivue.loadVolumes` will _clear_ any currently loaded volume,
   * so to add new volumes it is necessary to pass old volumes as well.
   */
  public async loadVolumes(volumes: NVRVolume[]) {
    await this.nv.loadVolumes(volumes.map(toLoadableVolume));
    volumes.forEach((volume) => this.handleSpecialImageProperties(volume));
    this.workaroundLoadVolumesColorbarBug(volumes);
  }

  /**
   * Workaround for upstream bug https://github.com/niivue/niivue/issues/848
   *
   * `colorbarVisible` is a key of `ImageFromUrlOptions` but it is not respected by `nv.loadVolumes`
   */
  private workaroundLoadVolumesColorbarBug(volumes: NVRVolume[]) {
    const needToSetColorbarVisible = volumes.filter(
      (v): v is { colorbarVisible: boolean; url: string } =>
        "colorbarVisible" in v,
    );
    if (needToSetColorbarVisible.length > 0) {
      needToSetColorbarVisible.forEach(
        (vol, i) => (this.nv.volumes[i].colorbarVisible = vol.colorbarVisible),
      );
      this.nv.updateGLVolume();
    }
  }

  /**
   * Handle special properties such as the keys of `SpecialVolumeOptions`.
   */
  private handleSpecialImageProperties(volume: NVRVolume) {
    if ("modulationImageUrl" in volume) {
      this.setModulationImage(volume, volume.modulationImageUrl);
    }
  }

  /**
   * Wrapper for `this.nv.setModulationImage`
   */
  private setModulationImage(
    target: NVRVolume,
    modulateUrl: string | null | undefined,
  ) {
    const targetImage = this.nv.getMediaByUrl(target.url) as NVImage;
    if (modulateUrl === null || modulateUrl === undefined) {
      // upstream bug: parameter of setModulationImage should be nullable
      // https://github.com/niivue/niivue/pull/859
      this.nv.setModulationImage(
        targetImage.id,
        // @ts-ignore
        null,
        target.modulateAlpha || 0,
      );
      return;
    }
    const modulationImage = this.nv.getMediaByUrl(modulateUrl);
    if (modulationImage === undefined) {
      console.warn(`modulationImageUrl not found in volumes: ${modulateUrl}`);
      return;
    }
    this.nv.setModulationImage(
      targetImage.id,
      modulationImage.id,
      target.modulateAlpha || 0,
    );
  }

  /**
   * Apply changes to already loaded volumes.
   */
  public applyVolumeChanges(changes: NVRVolume) {
    this.applyImageSettableChanges(changes);
    this.handleSpecialImageProperties(changes);
  }

  /**
   * Apply whatever properties of `nv.volumes[*]` which can be set directly on an `NVImage`.
   */
  private applyImageSettableChanges(changes: NVRVolume) {
    const volumeIndex = this.getVolumeIndex(changes);
    typedEntries(changes).forEach(([propertyName, value]) => {
      if (!isVolumeOption(propertyName)) {
        return;
      }
      /*
       * There are 3 ways a property can be set in Niivue:
       *
       * 1. a setter function which takes in an index (number)
       * 2. a setter function which takes in an id (string)
       * 3. no setter function given, must set property then call nv.updateGLVolume()
       */
      const setters: (() => (() => void) | null)[] = [
        () => {
          const setter = this.volumeUpdateFunctionByIndexMap[propertyName];
          return setter ? () => setter(volumeIndex, value) : null;
        },
        () => {
          const setter = this.volumeUpdateFunctionByIdMap[propertyName];
          return setter
            ? () => setter(this.nv.volumes[volumeIndex].id, value)
            : null;
        },
        () => {
          return () => {
            // fallback: manually set volume property then update.
            // https://github.com/niivue/niivue/blob/41b134123870fb0b69540a2d8155e75ec8e06339/demos/features/modulate.html#L50-L51
            // @ts-ignore
            this.nv.volumes[volumeIndex][propertyName] = value;
            this.nv.updateGLVolume();
          };
        },
      ];
      for (const getSetter of setters) {
        const setter = getSetter();
        if (setter !== null) {
          setter();
          return;
        }
      }
    });
  }

  private getVolumeIndex(volume: NVRVolume): number {
    const loadedImage = this.nv.getMediaByUrl(volume.url);
    const i = this.nv.volumes.findIndex((volume) => volume === loadedImage);
    if (i === -1) {
      throw new Error(`No volume found with URL ${volume.url}`);
    }
    return i;
  }
}

// /**
//  * Converts to `LoadFromUrlParams` (which is not exported by niivue).
//  */
// function canonicalizeNvrMesh(mesh: NVRMesh): HasUrlObject {
//   if (mesh.layers) {
//     return {
//       ...mesh,
//       layers: Object.values(mesh.layers),
//     };
//   }
//   return mesh;
// }

/**
 * Wrapper around `Object.entries` with safe type coercion of the keys to `keyof T`.
 */
function typedEntries<V, T extends { [key: string]: V }>(x: T): [keyof T, V][] {
  return Object.entries(x).map(([k, v]) => [k as keyof T, v]);
}

/**
 * Fields of `NVRVolume` which cannot be changed by setting them directly on `nv.volumes[i]`.
 */
const SPECIAL_IMAGE_FIELDS: (keyof NVRVolume)[] = ["url", "modulationImageUrl"];

/**
 * Fields of `NVRVolume` which are unsupported by `Niivue.loadVolumes`.
 */
const UNLOADABLE_IMAGE_FIELDS: (keyof NVRVolume)[] = [
  "modulationImageUrl",
  "modulateAlpha",
];

/**
 * Helper function for filtering volume properties which can be set directly on `NVImage`.
 */
function isVolumeOption(name: keyof NVRVolume): name is keyof ImageOptions {
  // does TypeScript have a "keyof" function which works in an if statement at runtime?
  return SPECIAL_IMAGE_FIELDS.findIndex((key) => name === key) === -1;
}

/**
 * Type for parameter supported by `Niivue.loadVolumes`.
 * It's a subset of `ImageFromUrlOptions`, which is sadly a private type.
 */
type LoadableVolume = LoadableVolumeOptions & {
  url: string;
};

/**
 * If necessary, copies `volume` and deletes fields which are unsupported by `Niivue.loadVolumes`.
 * This of course means that `Niivue.loadVolumes` might not complete the job.
 */
function toLoadableVolume(volume: NVRVolume): LoadableVolume {
  const toRemove = UNLOADABLE_IMAGE_FIELDS.filter((name) => name in volume);
  if (toRemove.length === 0) {
    return volume;
  }
  const copy: NVRVolume = { ...volume };
  toRemove.forEach((name) => delete copy[name]);
  return copy;
}

export default NiivueMutator;
