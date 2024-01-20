import { NiivueCanvas, NVROptions, NVRVolume } from "../src";

import { useImmer } from "use-immer";
import React from "react";

const ReadmeExample = () => {
  const [volumes, setVolumes] = useImmer<{ [key: string]: NVRVolume }>({
    brain: {
      url: "https://fetalmri-hosting-of-medical-image-analysis-platform-dcb83b.apps.shift.nerc.mghpcc.org/api/v1/files/23/template.nii.gz",
    },
    ventricle: {
      url: "https://fetalmri-hosting-of-medical-image-analysis-platform-dcb83b.apps.shift.nerc.mghpcc.org/api/v1/files/49/ventricles.nii.gz",
      opacity: 0.5,
      colormap: "red",
    },
  });
  const [options, setOptions] = useImmer<NVROptions>({
    isOrientCube: true,
  });

  const setOpacity = (value: number) => {
    setVolumes((draft) => {
      draft.ventricle.opacity = value;
    });
  };

  const setOrientCube = (value: boolean) => {
    setOptions((draft) => {
      draft.isOrientCube = !value;
    });
  };

  return (
    <>
      <div>
        <label>
          Show Orient Cube
          <input
            type="checkbox"
            onChange={(e) => setOrientCube(!e.target.checked)}
            checked={options.isOrientCube}
          />
        </label>
        <label>
          Ventricles Opacity
          <input
            type="range"
            min="0.0"
            max="1.0"
            step="0.1"
            onChange={(e) => setOpacity(e.target.value)}
            value={volumes.ventricle.opacity}
          />
        </label>
      </div>
      <div>
        <NiivueCanvas options={options} volumes={Object.values(volumes)} />
      </div>
    </>
  );
};

export default ReadmeExample;
