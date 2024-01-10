import { test, expect } from "@playwright/experimental-ct-react";
import { Niivue } from "@niivue/niivue";
import { NiivueCanvas, NVRVolume } from "../../src";
import { HasUrlObject } from "../../src/model.ts";
import { NiivueCanvasForTest } from "../../playwright/NiivueCanvas.story.tsx";

test.use({ viewport: { width: 500, height: 500 } });

test("NiivueCanvas can load volumes", async ({ mount }) => {
  const volumeNames = ["cope1.nii.gz", "mean_func.nii.gz"];
  const volumes = volumeNames.map(toHasUrl);

  let onSyncCalled = false;

  const onSync = (nv: Niivue) => {
    expect(nv.document.volumes).toHaveLength(volumeNames.length);
    const actual = nv.document.volumes.map((nvimage) => {
      return { url: nvimage.url };
    });
    volumes.forEach((expected) => expect(actual).toContainEqual(expected));
    onSyncCalled = true;
  };

  await mount(<NiivueCanvas onSync={onSync} volumes={volumes} />);
  await expect.poll(() => onSyncCalled).toBe(true);
});

test("NiivueCanvas can add and remove volumes", async ({ mount }) => {
  const initialVolumes = ["mean_func.nii.gz"].map(toHasUrl);
  const component = await mount(
    <NiivueCanvasForTest initialVolumes={initialVolumes} />,
  );
  await expect(component.getByTitle("nv-volume-data")).toHaveCount(1);
  await expect(component.getByTestId("nv-volume-urls")).toHaveText(
    /^.+\/mean_func\.nii\.gz$/,
  );

  const setVolumes = async (volumes: NVRVolume[]) => {
    await component.getByTestId("volumes-string").fill(JSON.stringify(volumes));
    await component.getByTestId("set-volumes").click();
  };

  await setVolumes(["mean_func.nii.gz", "cope1.nii.gz"].map(toHasUrl));
  await expect(component.getByTitle("nv-volume-data")).toHaveCount(2);
  await expect(component.getByTestId("nv-volume-urls")).toHaveText(
    /\/mean_func\.nii\.gz/,
  );
  await expect(component.getByTestId("nv-volume-urls")).toHaveText(
    /\/cope1\.nii\.gz/,
  );
});

function toHasUrl(name: string): HasUrlObject {
  return {
    url: `http://localhost:5173/images/${name}`,
  };
}
