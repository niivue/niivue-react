import React, { useRef } from "react";
import { NVRMesh, NVRVolume, NVROptions, HasUrlObject } from "./model.ts";
import { Niivue } from "@niivue/niivue";
import { Diff, diffList } from "./diff.ts";

/**
 * Fields of a `NVRVolume` which must be handled in a special way.
 */
const SPECIAL_IMAGE_FIELDS = ["modulationImageUrl"];

/**
 * Remove fields which are listed in `SPECIAL_IMAGE_FIELDS`.
 */
function sanitizeImage<T extends HasUrlObject>(image: T): T {
  const toRemove = SPECIAL_IMAGE_FIELDS.filter((name) => name in image);
  if (!toRemove) {
    return image;
  }
  const copy: T = { ...image };
  toRemove.forEach((name) => delete copy[name]);
  return copy;
}

type NiivueCanvasProps = {
  meshes?: NVRMesh[];
  volumes?: NVRVolume[];
  options?: NVROptions;
  onStart?: (nv: Niivue) => void;
  onSync?: (nv: Niivue) => void;
};

/**
 * A wrapper around `Niivue` in a canvas providing a declarative, React-friendly API.
 *
 * @param meshes Meshes to display.
 * @param volumes Volumes to display.
 * @param options Niivue instance options.
 * @param onStart Called after the Niivue instance is attached to the HTML canvas.
 *                This function provides the parent access to a mutable reference
 *                of the Niivue instance, which can be used for unimplemented
 *                functionality or situations which require mutability e.g. setting
 *                `nv.onLocationChange` or `nv.broadcastTo`. It can also do a lot
 *                of damage!
 *
 *                N.B. `onStart` is called after attaching to the canvas, but before
 *                data are loaded.
 * @param onSync Called each time after files are done loading.
 *               Primarily used for testing.
 */
const NiivueCanvas: React.FC<NiivueCanvasProps> = ({
  meshes,
  volumes,
  options,
  onStart,
  onSync
}: NiivueCanvasProps) => {
  if (meshes) {
    throw new Error("NiivueCanvas does not yet support meshes!");
  }

  const canvasRef = React.useRef();
  const nvRef = React.useRef(new Niivue());
  const [ready, setReady] = React.useState(false);

  const prevVolumesRef = useRef<NVRVolume[]>([]);
  const prevOptionsRef = useRef<NVROptions>({});

  const nv = nvRef.current;

  // a map which associates property names with their corresponding Niivue setter function.
  const volumeUpdateFunctionMap: {
    [key: string]: (index: number, value: any) => void;
  } = {
    opacity: nv.setOpacity,
    colormap: nv.setColormap,
    colormapNegative: nv.setColormapNegative,
  };

  const setup = async () => {
    // @ts-ignore
    await nv.attachToCanvas(canvasRef.current);
    onStart && onStart(nv);
  };

  const syncStateWithProps = async () => {
    // note: for efficiency, we could mutate nv's fields directly then call nv.updateGLVolume...
    // but that would be very brittle.
    syncConfig();
    await Promise.all([syncVolumes()]);
    onSync && onSync(nv);
  };

  const syncVolumes = async () => {
    if (prevVolumesRef.current === volumes) {
      return;
    }
    const prevVolumes = prevVolumesRef.current;
    const nextVolumes = volumes || [];
    prevVolumesRef.current = nextVolumes;

    const diffs = diffList(prevVolumes, nextVolumes);
    diffs.removed.forEach((vol) => nv.removeVolumeByUrl(vol.url));
    if (diffs.added.length > 0) {
      await reloadVolumes(prevVolumes, diffs);
    }
    mutateVolumeProperties(diffs.changed);
  };

  /**
   * Reload all previously loaded volumes as well as newly added volumes.
   *
   * @param prevVolumes previously loaded volumes
   * @param diffs object containing new volumes you want to add
   */
  const reloadVolumes = async (
    prevVolumes: NVRVolume[],
    diffs: Diff<NVRVolume>,
  ) => {
    // nv.loadVolumes also removes the currently loaded volumes,
    // so we need to include them in the parameter to nv.loadVolumes
    const notRemoved = (prevVolume) =>
      diffs.removed.length === 0
        ? true
        : !diffs.removed.find((removedVolume) => removedVolume === prevVolume);
    const volumesToLoad = prevVolumes.filter(notRemoved).concat(diffs.added);
    await nv.loadVolumes(volumesToLoad.map(sanitizeImage));
    volumesToLoad.forEach(handleSpecialImageFields);
  };

  /**
   * Apply a change of state to volumes which are already loaded to this Niivue instance.
   */
  const mutateVolumeProperties = (changes: HasUrlObject[]) => {
    changes.map(sanitizeImage).forEach(applyVolumeChanges);
    changes.forEach(handleSpecialImageFields);
  };

  const syncConfig = () => {
    if (prevOptionsRef.current === options) {
      return;
    }
    const nextConfig = options === undefined ? {} : options;
    prevOptionsRef.current = nextConfig;

    // some options e.g. isSliceMM have setter methods, but not all of them do e.g. isOrientCube.
    // for efficiency, we mutate nv.opts and then call nv.updateGLVolume() directly.
    // @ts-ignore
    Object.entries(nextConfig).forEach(([key, value]) => {
      if (key in nv.opts) {
        // @ts-ignore
        nv.opts[key] = value;
      } else if (key in nv) {
        // @ts-ignore
        nv[key] = value;
      } else {
        console.warn(
          `Don't know how to handle ${key}=${JSON.stringify(value)}`,
        );
      }
    });
    nv.updateGLVolume();
  };

  const applyVolumeChanges = (changes: NVRVolume) => {
    const volumeIndex = getVolumeIndex(changes);
    Object.entries(changes).forEach(([propertyName, value]) => {
      const setter = volumeUpdateFunctionMap[propertyName];
      if (setter) {
        setter.bind(nv)(volumeIndex, value);
      } else {
        // fallback: manually set volume property then update.
        // https://github.com/niivue/niivue/blob/41b134123870fb0b69540a2d8155e75ec8e06339/demos/features/modulate.html#L50-L51
        nv.volumes[volumeIndex][propertyName] = value;
        nv.updateGLVolume();
      }
    });
  };

  /**
   * Handle the fields listed in `SPECIAL_IMAGE_FIELDS`.
   */
  const handleSpecialImageFields = (image: NVRVolume) => {
    if ("modulationImageUrl" in image) {
      setModulationImage(image, image.modulationImageUrl);
    }
  };

  const setModulationImage = (
    target: NVRVolume,
    modulateUrl: string | null | undefined,
  ) => {
    const targetImage = nv.getMediaByUrl(target.url);
    if (modulateUrl === null || modulateUrl === undefined) {
      nv.setModulationImage(targetImage.id, null, target.modulateAlpha || 0);
      return;
    }
    const modulationImage = nv.getMediaByUrl(modulateUrl);
    if (modulationImage === undefined) {
      console.warn(`modulationImageUrl not found in volumes: ${modulateUrl}`);
      return;
    }
    nv.setModulationImage(
      targetImage.id,
      modulationImage.id,
      target.modulateAlpha || 0,
    );
  };

  const getVolumeIndex = (volume: NVRVolume): number => {
    const loadedImage = nv.getMediaByUrl(volume.url);
    const i = nv.volumes.findIndex((volume) => volume === loadedImage);

    if (i === -1) {
      throw new Error(`No volume found with URL ${volume.url}`);
    }

    return i;
  };

  const glIsReady = (): boolean => {
    try {
      return !!nv.gl;
    } catch (_e: any) {
      return false;
    }
  };

  if (ready && glIsReady()) {
    syncStateWithProps();
  }

  React.useEffect(() => {
    setup().then(() => setReady(true));
  }, []);

  return (
    <div>
      <canvas ref={canvasRef} />
    </div>
  );
};

export type { NiivueCanvasProps };
export { NiivueCanvas };
