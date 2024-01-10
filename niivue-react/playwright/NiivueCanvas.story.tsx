import React, { useState, useRef } from "react";
import { NiivueCanvas } from "../src";
import { NVRMesh, NVROptions, NVRVolume } from "../src";
import { Niivue, NVImage, NVMesh } from "@niivue/niivue";

type NiivueCanvasForTestProps = {
  initialVolumes?: NVRVolume[];
};

/**
 * A subset of the fields of Niivue which are copyable.
 */
type NiivueData = {
  volumes: NVImage[]
}

/**
 * Testing harness for `NiivueCanvas` which provides:
 *
 * - input elements that Playwright can use for calling state-setting functions
 * - text elements that Playwright can use to inspect the current state of the Niivue object instance
 */
const NiivueCanvasForTest: React.FC<NiivueCanvasForTestProps> = ({
  initialVolumes,
}: NiivueCanvasForTestProps) => {
  const [volumes, setVolumes] = useState<NVRVolume[] | undefined>(
    initialVolumes,
  );
  // const [meshes, setMeshes] = useState<NVRVolume[]>([]);
  const [options, setOptions] = useState<NVROptions>({});
  const [volumesInputString, setVolumesInputString] = useState("");
  // const [realNv, setRealNv] = useState<Niivue | undefined>();
  const [nv, setNv] = useState<NiivueData | undefined>();
  const realNvRef = useRef<Niivue | undefined>();

  const assertNvRefDoesNotChange = (nv: Niivue) => {
    if (realNvRef.current === undefined) {
      realNvRef.current = nv;
      return;
    }
    if (realNvRef.current !== nv) {
      throw Error(
        "Niivue object reference was changed. You shouldn't do this (bad performance...)",
      );
    }
  }

  const onSync = (givenNv: Niivue) => {
    assertNvRefDoesNotChange(givenNv);
    // we can't just use givenNv/realNv as nv because React won't rerender when it mutates
    setNv({volumes: givenNv.volumes});
  };

  return (
    <>
      <div>
        <NiivueCanvas
          volumes={volumes}
          // meshes={meshes}
          options={options}
          onSync={onSync}
        />
      </div>
      <div>
        <input
          data-testid="volumes-string"
          value={volumesInputString}
          onChange={(e) => setVolumesInputString(e.target.value)}
        />
        <button
          data-testid="set-volumes"
          onClick={() => setVolumes(JSON.parse(volumesInputString))}
        />

        {nv && (
          <div data-testid="nv-internal-state">
            <span data-testid="nv-volume-urls">
              {nv.volumes.map((v) => v.url).join(",")}
            </span>
            <ol data-testid="nv-volume-list">
              {nv.volumes.map((volume) => (
                <li
                  title="nv-volume-data"
                  data-testid={`nv-volume-${volume.id}`}
                >
                  {JSON.stringify(volume)}
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
    </>
  );
};

export type { NiivueCanvasForTestProps };
export { NiivueCanvasForTest };
