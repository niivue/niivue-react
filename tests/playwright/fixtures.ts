import { test as base, expect } from "@playwright/test";
import { NVImage } from "@niivue/niivue";
import { NVRVolume } from "../../src";
import * as fsPromises from "node:fs/promises";
import * as path from "node:path";
import v8toIstanbul from "v8-to-istanbul";

type NiivueCanvasTest = {
  /**
   * Get a loaded volume from the Niivue instance.
   */
  getVolume: (name: string) => Promise<NVImage>;
  /**
   * Set the state of `NiivueCanvas` with volumes.
   */
  setVolumes: (volumes: NVRVolume[]) => Promise<void>;
};

type MyFixtures = {
  /**
   * Indicates that the test should be using `examples/NiivueCanvasForPlaywrightTest.tsx`.
   * The testing function is provided with helper functions `nvt.getVolume` and `nvt.setVolumes`.
   */
  nvt: NiivueCanvasTest;
  /**
   * Indicates that the test should be run with coverage using Playwright's v8 code coverage.
   */
  _withCoverage: undefined;
};

export const test = base.extend<MyFixtures>({
  nvt: async ({ page }, use) => {
    const setVolumes = async (volumes: NVRVolume[]) => {
      await page.getByTestId("volumes-string").fill(JSON.stringify(volumes));
      await page.getByTestId("set-volumes").click();
    };
    const getVolume = async (name: string): Promise<NVImage> => {
      const getText = async () => {
        return await page.getByTestId(`nv-volume-${name}`).innerText();
      };
      await expect.poll(getText).toContain(name);
      return JSON.parse(await getText());
    };
    await page.goto("http://localhost:5173/playwright_harness");
    await use({ setVolumes, getVolume });
  },
  _withCoverage: async ({ page }, use, testInfo) => {
    await page.coverage.startJSCoverage();
    await use(undefined);

    const coverage = await page.coverage.stopJSCoverage();
    const srcPath = "@fs" + path.normalize(`${__dirname}/../../src`);
    const srcCoveragePromises = coverage
      .filter((entry) => entry.url.includes(srcPath))
      .map(async (entry) => {
        // note: see e1fe8f30dae184e04b2d41849fafe10dfb785389 for example of using
        // native v8 coverage without v8-to-istanbul
        const converter = v8toIstanbul("", 0, {
          source: entry.source as string,
        });
        await converter.load();
        converter.applyCoverage(entry.functions);
        return converter.toIstanbul();
      });
    const srcCoverageList = await Promise.all(srcCoveragePromises);
    const srcCoverage = srcCoverageList.reduce((allCoverage, entryCoverage) => {
      return { ...allCoverage, ...entryCoverage };
    }, {});
    await fsPromises.mkdir("coverage-playwright", { recursive: true });
    const testTitle = testInfo.title.replaceAll("/", "_");
    await fsPromises.writeFile(
      `coverage-playwright/${testTitle}.json`,
      JSON.stringify(srcCoverage, null, 2),
    );
  },
});

export { expect } from "@playwright/test";
