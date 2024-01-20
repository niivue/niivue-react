import { NiivueCanvas, NVROptions, NVRVolume } from "../../src";

import { useImmer } from "use-immer";
import { Niivue, SLICE_TYPE } from "@niivue/niivue";
import React, { useState } from "react";

import styles from "./upstream.module.css";

const FIXED_OPTIONS: NVROptions = {
  isColorbar: true,
  backColor: [0.2, 0.2, 0.3, 1],
  isNearestInterpolation: true,
  sliceType: SLICE_TYPE.MULTIPLANAR,
};

const ModulateScalar = () => {
  const [crosshairLocation, setCrosshairLocation] = useState("");
  const [volumes, setVolumes] = useImmer<{ [key: string]: NVRVolume }>({
    func: {
      url: "/images/mean_func.nii.gz",
      opacity: 1,
      colormap: "gray",
    },
    cope: {
      url: "/images/cope1.nii.gz",
      colormap: "winter",
      opacity: 1,
      cal_min: 0.0,
      cal_max: 100,
      modulationImageUrl: "/images/tstat1.nii.gz",
      modulateAlpha: 1,
    },
    tstat: {
      url: "/images/tstat1.nii.gz",
      opacity: 0,
      colormap: "warm",
      cal_min: 0,
      cal_max: 4.5,
    },
  });

  const modeNames = Object.keys(volumes).concat(["modulate"]);

  const getMode = () => {
    if (volumes.cope?.modulationImageUrl) {
      return "modulate";
    }
    const opaqueVolume = Object.entries(volumes)
      .filter(([key, _value]) => key !== "func") // always opacity=1
      .find(([_key, value]) => value.opacity > 0);
    return opaqueVolume === undefined ? "func" : opaqueVolume[0];
  };

  /**
   * Equivalent to
   * https://github.com/niivue/niivue/blob/41b134123870fb0b69540a2d8155e75ec8e06339/demos/features/modulateScalar.html#L122-L138
   */
  const onModeSelected = (e: React.SyntheticEvent) => setMode(e.target.value);

  const setMode = (selectedMode: string) => {
    setVolumes((draft) => {
      draft.func.opacity = 1.0; // background image
      draft.tstat.opacity = 0.0; // hide tstat
      draft.cope.opacity = 0.0; // hide cope
      if (selectedMode === "modulate") {
        draft.cope.opacity = 1.0; // show cope
        draft.tstat.opacity = 0.0; // hide tstat
        draft.cope.modulationImageUrl = volumes.tstat.url;
      } else {
        // https://github.com/niivue/niivue/blob/41b134123870fb0b69540a2d8155e75ec8e06339/demos/features/modulateScalar.html#L127
        draft[selectedMode].opacity = 1.0;
        // https://github.com/niivue/niivue/blob/41b134123870fb0b69540a2d8155e75ec8e06339/demos/features/modulateScalar.html#L137
        draft.cope.modulationImageUrl = null;
      }
    });
  };

  /**
   * Equivalent to
   * https://github.com/niivue/niivue/blob/41b134123870fb0b69540a2d8155e75ec8e06339/demos/features/modulateScalar.html#L131C15-L131C28
   */
  const onAlphaToggled = (_e: React.SyntheticEvent) =>
    setModulateAlpha(volumes.cope.modulateAlpha === 0 ? 1 : 0);

  const setModulateAlpha = (alpha: number) => {
    setVolumes((draft) => {
      draft.cope.modulateAlpha = alpha;
    });
  };

  const configNiivue = (nv: Niivue) => {
    // @ts-ignore
    nv.onLocationChange = setCrosshairLocation;
  };

  return (
    <div className={styles.root}>
      <header>
        <label htmlFor="mode">Display:</label>
        <select
          name="mode"
          id="mode"
          value={getMode()}
          onChange={onModeSelected}
        >
          {modeNames.map((mode) => (
            <option value={mode} key={mode}>
              {mode}
            </option>
          ))}
        </select>
        {/*<label htmlFor="slideT"> &nbsp; tMax</label>*/}
        {/*<input*/}
        {/*  type="range"*/}
        {/*  min="1"*/}
        {/*  max="50"*/}
        {/*  value="45"*/}
        {/*  className="slider"*/}
        {/*  id="slideT"*/}
        {/*/>*/}
        {/*<label htmlFor="slideC"> &nbsp; cMax</label>*/}
        {/*<input*/}
        {/*  type="range"*/}
        {/*  min="1"*/}
        {/*  max="200"*/}
        {/*  value="100"*/}
        {/*  className="slider"*/}
        {/*  id="slideC"*/}
        {/*/>*/}
        {/*<label htmlFor="slide2"> &nbsp; Outline</label>*/}
        {/*<input*/}
        {/*  type="range"*/}
        {/*  min="0"*/}
        {/*  max="4"*/}
        {/*  value="1"*/}
        {/*  className="slider"*/}
        {/*  id="slide2"*/}
        {/*/>*/}
        {/*<label htmlFor="check">ClipDark</label>*/}
        {/*<input type="checkbox" id="check" unchecked />*/}
        <label>
          ModulateAlpha
          <input
            type="checkbox"
            onChange={onAlphaToggled}
            checked={volumes.cope.modulateAlpha === 1}
          />
        </label>
      </header>
      <main>
        <NiivueCanvas
          volumes={Object.values(volumes)}
          options={FIXED_OPTIONS}
          onStart={configNiivue}
        />
      </main>
      <footer>{crosshairLocation.string}</footer>
    </div>
  );
};

export default ModulateScalar;
