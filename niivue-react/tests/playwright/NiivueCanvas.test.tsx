
import { test, expect } from "@playwright/experimental-ct-react";
import { Niivue } from "@niivue/niivue";
import { NiivueCanvas } from "../../src";
import {HasUrlObject} from "../../src/model.ts";

test.use({ viewport: { width: 500, height: 500 } });

test("NiivueCanvas can load volumes", async ({ mount }) => {
  const volumeNames = ["cope1.nii.gz", "mean_func.nii.gz"];
  const volumes = volumeNames.map(toHasUrl);

  let onSyncCalled = false;

  const onSync = (nv: Niivue) => {
    expect(nv.document.volumes).toHaveLength(volumeNames.length);
    const actual = nv.document.volumes.map((nvimage) => {return {url: nvimage.url}});
    volumes.forEach((expected) => expect(actual).toContainEqual(expected));
    onSyncCalled = true;
  };

  await mount(<NiivueCanvas onSync={onSync} volumes={volumes} />);
  await expect.poll(() => onSyncCalled).toBe(true);
});

//
// test("NiivueCanvas can add and remove volumes", async ({ mount }) => {
//   const beforeVolumes = [
//     { url: "/images/mean_fun.nii.gz" },
//   ];
//   const afterVolumes = [
//     { url: "/images/cope1.nii.gz" },
//     { url: "/images/mean_fun.nii.gz" },
//   ];
//
//   const testingActions: ((args: InjectedTestArgs) => void)[] = [
//     ({nv, setVolumes}) => {
//       expect(nv.volumes.length).toBe(2);
//     },
//     ({nv, setVolumes}) => {
//       expect(nv.volumes.length).toBe(1);
//     }
//   ];
//
//   const ele = <NiivueCanvasHarness testingActions={testingActions} initialVolumes={beforeVolumes} testingDeadline={20000} />;
//   await mount(ele);
// });

function toHasUrl(name: string): HasUrlObject {
  return {
    url: `http://localhost:5173/images/${name}`
  };
}
