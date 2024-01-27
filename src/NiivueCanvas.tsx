import React, { useRef } from "react";
import { NVRMesh, NVRVolume, NVROptions } from "./model.ts";
import { Niivue } from "@niivue/niivue";
import { Diff, diffList, diffPrimitive, noChange } from "./diff.ts";
import NiivueMutator from "./NiivueMutator.ts";

type NiivueCanvasProps = {
  meshes?: NVRMesh[];
  volumes?: NVRVolume[];
  options?: NVROptions;
  onStart?: (nv: Niivue) => void;
  onChanged?: (nv: Niivue) => void;
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
 * @param onChanged Called each time a mutation happens to the Niivue instance.
 */
const NiivueCanvas: React.FC<NiivueCanvasProps> = ({
  meshes,
  volumes,
  options,
  onStart,
  onChanged,
}: NiivueCanvasProps) => {
  if (meshes) {
    throw new Error("NiivueCanvas does not yet support meshes!");
  }

  const canvasRef = React.useRef<HTMLCanvasElement>(null);
  const nvRef = React.useRef(new Niivue());
  const [ready, setReady] = React.useState(false);

  const prevVolumesRef = useRef<NVRVolume[]>([]);
  const prevOptionsRef = useRef<NVROptions>({});

  const nv = nvRef.current;
  const nvMutator = new NiivueMutator(nv);

  const setup = async () => {
    await nv.attachToCanvas(canvasRef.current as HTMLCanvasElement);
    onStart && onStart(nv);
  };

  const syncStateWithProps = async () => {
    const configChanged = syncConfig();
    const [volumesChanged] = await Promise.all([syncVolumes()]);
    onChanged && (configChanged || volumesChanged) && onChanged(nv);
  };

  /**
   * Sync the value of `volumes` with the Niivue instance.
   *
   * @returns true if `volumes` was changed
   */
  const syncVolumes = async (): Promise<boolean> => {
    if (prevVolumesRef.current === volumes) {
      return false;
    }
    const prevVolumes = prevVolumesRef.current;
    const nextVolumes = volumes || [];
    prevVolumesRef.current = nextVolumes;

    const diffs = diffList(prevVolumes, nextVolumes);
    if (noChange(diffs)) {
      return false;
    }

    if (diffs.added.length > 0) {
      await reloadVolumes(prevVolumes, diffs);
    } else if (diffs.removed.length > 0) {
      diffs.removed.forEach((vol) => nv.removeVolumeByUrl(vol.url));
    }
    diffs.changed.forEach((vol) => nvMutator.applyVolumeChanges(vol));
    return true;
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
    const notRemoved = (prevVolume: NVRVolume) =>
      diffs.removed.length === 0
        ? true
        : !diffs.removed.find((removedVolume) => removedVolume === prevVolume);
    const volumesToLoad = prevVolumes.filter(notRemoved).concat(diffs.added);
    await nvMutator.loadVolumes(volumesToLoad);
  };

  /**
   * Sync the value of `options` with the Niivue instance.
   *
   * @returns true if `options` was changed
   */
  const syncConfig = (): boolean => {
    if (prevOptionsRef.current === options) {
      return false;
    }
    const nextConfig = options === undefined ? {} : options;
    const diffConfig = diffPrimitive(
      prevOptionsRef.current,
      nextConfig,
    ) as NVROptions;
    prevOptionsRef.current = nextConfig;

    if (Object.keys(diffConfig).length === 0) {
      return false;
    }
    nvMutator.applyOptions(diffConfig);
    return true;
  };

  if (ready && nvMutator.glIsReady()) {
    syncStateWithProps();
  }

  React.useEffect(() => {
    setup().then(() => setReady(true));
  }, []);

  return (<canvas ref={canvasRef} />);
};

export type { NiivueCanvasProps };
export { NiivueCanvas };
