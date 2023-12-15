// import React, { useEffect, useRef, useState } from "react";
import React from "react";
import {NVRMesh, NVRVolume, NVRConfig, canonicalizeNvrMesh, HasUrlObject} from './model.ts';
import {Niivue} from "@niivue/niivue";
import {diffList} from "./diff.ts";

type NiivueCanvasProps = {
  meshes?: NVRMesh[],
  volumes?: NVRVolume[],
  config?: NVRConfig
}

const NiivueCanvas: React.FC = ({meshes, volumes, config}: NiivueCanvasProps) => {

  const canvasRef = React.useRef();
  const nvRef = React.useRef(new Niivue());
  const [ready, setReady] = React.useState(false);

  const [prevMeshes, setPrevMeshes] = React.useState<NVRMesh[]>([]);
  const [prevVolumes, setPrevVolumes] = React.useState<NVRVolume[]>([]);
  const [prevConfig, setPrevConfig] = React.useState<NVRConfig>({});

  const nv = nvRef.current;

  // a map which associates property names with their corresponding Niivue setter function.
  const volumeUpdateFunctionMap: {[key: string]: (id: number, value: any) => void} = {
    opacity: nv.setOpacity,
    colormap: nv.setColormap,
    colormapNegative: nv.setColormapNegative,
  };

  const setup = async () => {
    // @ts-ignore
    await nv.attachToCanvas(canvasRef.current);
    await syncStateWithProps();
    setReady(true);
  };

  const syncStateWithProps = async () => {

  };

  const syncVolumes = async () => {
    const diffs = diffList(prevVolumes, volumes || []);
    diffs.removed.forEach((vol) => nv.removeVolumeByUrl(vol.url));
    await nv.loadVolumes(diffs.added);
    diffs.changed.forEach(applyVolumeChanges);
  };

  const applyVolumeChanges = (changes: NVRVolume) => {
    const loadedVolume = nv.getMediaByUrl(changes.url);
    Object.entries(changes).forEach(([propertyName, value]) => {
      const setter = volumeUpdateFunctionMap[propertyName];
      if (setter) {
        setter(loadedVolume.id, value);
      } else {
        // fallback: manually set volume property then update.
        // https://github.com/niivue/niivue/blob/41b134123870fb0b69540a2d8155e75ec8e06339/demos/features/modulate.html#L50-L51
        nv.volumes[loadedVolume.id][propertyName] = value;
        nv.updateGLVolume();
      }
    })
  };

  React.useEffect(() => {
    if (ready) {
      syncStateWithProps();
    } else {
      setup();
    }
  }, []);

  return (<div><canvas ref={canvasRef.current} /></div>);
};

export {NiivueCanvas};
