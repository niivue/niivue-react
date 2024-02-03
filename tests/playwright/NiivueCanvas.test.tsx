import {expect, test} from "./fixtures.ts";

test.use({ viewport: { width: 500, height: 500 } });

test("initial volumes are loaded", async ({ page }) => {
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

test("add and remove volumes", async ({ page, nvt }) => {
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

test("can set and change colormap", async ({ page, nvt }) => {
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

// skipped until https://github.com/niivue/niivue/pull/864 gets merged
test.skip("can set crosshairWidth", async ({ nvt }) => {
  // regression test: having the option crosshairWidth without the 3D render being shown can cause an exception
  // if nv.setCrosshairWidth is called.
  await nvt.setOptions({crosshairWidth: 10, sliceType: 0 }); // axial
  expect(await nvt.getOpts()).toHaveProperty('crosshairWidth', 10);
  await nvt.setVolumes([{ url: "/images/mean_func.nii.gz" }]);
  await nvt.setOptions({crosshairWidth: 10, multiplanarForceRender: true, sliceType: 3}); // multiplanar
  expect(await nvt.getOpts()).toHaveProperty('crosshairWidth', 10);
});

test("can set crosshairColor", async ({ nvt }) => {
  // regression test: having the option crosshairWidth without the 3D render being shown can cause an exception
  // if nv.setCrosshairWidth is called.
  await nvt.setOptions({crosshairColor: [0, 0.5, 0], sliceType: 0 }); // axial
  const nvOpts = await nvt.getOpts();
  expect(nvOpts).toHaveProperty('crosshairColor', [0, 0.5, 0]);
});
