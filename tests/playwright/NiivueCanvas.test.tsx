import { test, expect } from "./fixtures.ts";
import { Niivue, NVImage } from "@niivue/niivue";
import { NiivueCanvas, NVRVolume } from "../../src";
import { HasUrlObject } from "../../src/model.ts";

test.use({ viewport: { width: 500, height: 500 } });

test("initial volumes are loaded", async ({ page, _withCoverage }) => {
  const expectedUrls = [
    "**/images/mean_func.nii.gz",
    "**/images/cope1.nii.gz",
    "**/images/tstat1.nii.gz",
  ];
  const expectedRes = expectedUrls.map((url) => page.waitForResponse(url));
  await page.goto("http://localhost:5173/modulate_scalar");
  const responses = await Promise.all(expectedRes);
  const results = await Promise.all(responses.map((res) => res.finished()));
  results.forEach((result) => expect(result).toBeNull());
});

test("add and remove volumes", async ({ page, nvt, _withCoverage }) => {
  const volumes1 = [
    { url: "/images/mean_func.nii.gz" },
    { url: "/images/cope1.nii.gz", opacity: 0.5 },
  ];
  await nvt.setVolumes(volumes1);
  await expect(page.getByTitle("nv-volume-data")).toHaveCount(volumes1.length);
  const volumes2 = [
    { url: "/images/mean_func.nii.gz" },
    { url: "/images/cope1.nii.gz", opacity: 0.5 },
    { url: "/images/tstat1.nii.gz", cal_min: 0, cal_max: 4.5 },
  ];
  await nvt.setVolumes(volumes2);
  await expect(page.getByTitle("nv-volume-data")).toHaveCount(volumes2.length);
  await expect(page.getByTitle("nv-volume-url")).toHaveText(
    volumes2.map((v) => v.url),
  );
});

test("can set and change colormap", async ({ page, nvt, _withCoverage }) => {
  const getColormap = async () => {
    const vol1 = await nvt.getVolume("mean_func.nii.gz");
    return vol1._colormap;
  };
  const volumes1 = [{ url: "/images/mean_func.nii.gz", colormap: "blue" }];
  await nvt.setVolumes(volumes1);
  await expect(page.getByTitle("nv-volume-data")).toHaveCount(1);
  await expect.poll(getColormap).toBe("blue");
  const volumes2 = [{ url: "/images/mean_func.nii.gz", colormap: "red" }];
  await nvt.setVolumes(volumes2);
  await expect(page.getByTitle("nv-volume-data")).toHaveCount(1);
  await expect.poll(getColormap).toBe("red");
});
