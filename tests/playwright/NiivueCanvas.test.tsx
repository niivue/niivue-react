import { test, expect } from "./fixtures.ts";
import {Niivue, NVImage} from "@niivue/niivue";
import { NiivueCanvas, NVRVolume } from "../../src";
import { HasUrlObject } from "../../src/model.ts";

test.use({ viewport: { width: 500, height: 500 } });

test('initial volumes are loaded', async ({page}) => {
  const expectedUrls = [
    '**/images/mean_func.nii.gz',
    '**/images/cope1.nii.gz',
    '**/images/tstat1.nii.gz',
  ];
  const expectedRes = expectedUrls.map((url) => page.waitForResponse(url));
  await page.goto('http://localhost:5173/modulate_scalar');
  const responses = await Promise.all(expectedRes);
  const results = await Promise.all(responses.map((res) => res.finished()));
  results.forEach((result) => expect(result).toBeNull());
});

test("add and remove volumes", async ({ page, nvt }) => {
  const volumesFirst = [
    { url: '/images/mean_func.nii.gz'},
    { url: '/images/cope1.nii.gz', opacity: 0.5}
  ];
  await nvt.setVolumes(volumesFirst);
  await expect(page.getByTitle("nv-volume-data")).toHaveCount(volumesFirst.length);
  const volumesSecond = [
    { url: '/images/mean_func.nii.gz'},
    { url: '/images/cope1.nii.gz', opacity: 0.5},
    { url: '/images/tstat1.nii.gz', cal_min: 0, cal_max: 4.5}
  ];
  await nvt.setVolumes(volumesSecond);
  await expect(page.getByTitle("nv-volume-data")).toHaveCount(volumesSecond.length);
  await expect(page.getByTitle("nv-volume-url")).toHaveText(volumesSecond.map((v) => v.url));
});
