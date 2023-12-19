import React, {useState, useEffect, useRef} from "react";
import {NiivueCanvas, NVRMeshLayer} from "../src";
import { NVRMesh, NVROptions, NVRVolume } from "../src";
import {Niivue, NVImage, NVMesh} from "@niivue/niivue";

/**
 * Data from a Niivue object, as a plain object. This is done to work around limitations
 * of sharing objects between a playwright-controlled browser and tests running in node.js
 */

type NiivueRealState = {
  nv: Niivue,
  nvVolumes: NVImage[],
  nvMeshes: NVMesh[],
}

type NiivueCanvasForTestProps = {
  // meshes?: NVRMesh[],
  // options?: NVROptions,
  initialVolumes?: NVRVolume[];
  // onSync: (nv: Niivue) => void;
  testingSteps: ((beforeState: NiivueRealState) => NVRVolume[] | NVRMesh[] | NVROptions | null)[];
};

/**
 * A hacky testing harness for `NiivueCanvas` satisfying the limitations described here:
 * https://playwright.dev/docs/test-components
 *
 * @param initialVolumes initial value for `volumes`
 * @param testingActions TODO TODO TODO
 */
const NiivueCanvasForTest: React.FC<NiivueCanvasForTestProps> = ({
  initialVolumes,
}: NiivueCanvasForTestProps) => {
  const [volumes, setVolumes] = useState<NVRVolume[]>(initialVolumes || []);

  const onSync = () => {

  }

  return (
    <>
      <NiivueCanvas
        volumes={volumes}
        onSync={onSync}
        // onStart={}
      />
    </>
  );
};

export type { NiivueRealState, NiivueCanvasForTestProps };
export { NiivueCanvasForTest };
