/**
 * https://github.com/niivue/niivue/blob/bef7941124538e3e593fbce632b7d67826c9bc1e/demos/features/atlas.html
 * https://niivue.github.io/niivue/features/atlas.html
 */

import { NiivueCanvas, NVROptions, NVRVolume } from "../../src";

import { useImmer } from "use-immer";
import { Niivue } from "@niivue/niivue";
import React, { useState } from "react";
import styles from "./upstream.module.css";

import AalColormapLabel from "../public/images/aal.json";
import { ColorMap } from "../../src/reexport.ts";

const Atlas = () => {
  const [darkBackground, setDarkBackground] = useState(false);
  const [alpha, setAlpha] = useState(255);
  const [crosshairLocation, setCrosshairLocation] = useState("");

  const options: NVROptions = {
    // https://github.com/niivue/niivue/blob/bef7941124538e3e593fbce632b7d67826c9bc1e/demos/features/atlas.html#L67-L73
    backColor: darkBackground ? [0.5, 0.5, 0.5, 1] : [1, 1, 1, 1],
  };

  const volumes: NVRVolume[] = [
    {
      url: "/images/mni152.nii.gz",
    },
    {
      url: "/images/aal.nii.gz",
      colormapLabel: AalColormapLabel as ColorMap,
      opacity: alpha / 255,
    },
  ];

  return (
    <div className={styles.root}>
      <header>
        {/* not implemented */}
        {/*<label htmlFor="check1">Outline</label>*/}
        {/*<input type="checkbox" id="check1" unchecked/>*/}
        <label htmlFor="check2">Dark Background</label>
        <input
          type="checkbox"
          id="check2"
          checked={darkBackground}
          onChange={(e) => setDarkBackground(e.target.checked)}
        />
        <label htmlFor="alphaSlider">Opacity</label>
        <input
          type="range"
          min={1}
          max={255}
          value={alpha}
          onChange={(e) => setAlpha(e.target.valueAsNumber)}
          id="alphaSlider"
        />
        {/* not implemented */}
        {/*<label htmlFor="padSlider">Padding</label>*/}
        {/*<input*/}
        {/*  type="range"*/}
        {/*  min="0"*/}
        {/*  max="10"*/}
        {/*  value="5"*/}
        {/*  id="padSlider"*/}
        {/*/>*/}
      </header>
      <main>
        <NiivueCanvas
          volumes={volumes}
          options={options}
          onStart={(nv) => {
            nv.onLocationChange = (location: any) =>
              setCrosshairLocation(location.string);
          }}
        />
      </main>
      <footer id="location">{crosshairLocation}</footer>
    </div>
  );
};

export default Atlas;
