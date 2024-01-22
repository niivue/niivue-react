import { test as base, expect } from "@playwright/test";
import { NVImage } from "@niivue/niivue";
import { NVRVolume } from "../../src";
import * as fsPromises from "node:fs/promises";
import * as path from "node:path";

type NiivueCanvasTest = {
  getVolume: (name: string) => Promise<NVImage>;
  setVolumes: (volumes: NVRVolume[]) => Promise<void>;
};

type MyFixtures = {
  nvt: NiivueCanvasTest;
};

export const test = base.extend<MyFixtures>({
  page: async ({ page }, use, testInfo) => {
    // Use Playwright's built-in v8 coverage, write to a file
    // https://github.com/microsoft/playwright/issues/9208#issuecomment-1147884893
    await page.coverage.startJSCoverage();
    await use(page);

    const coverage = await page.coverage.stopJSCoverage();
    const srcPath = "@fs" + path.normalize(`${__dirname}/../../src`);
    const srcCoverage = coverage
      .filter((entry) => entry.url.includes(srcPath))
      .map((entry) => {
        return { ...entry, url: entry.url.replace(/^.+@fs/, "file://") };
      });
    await fsPromises.mkdir("coverage-playwright/tmp", { recursive: true });
    const testTitle = testInfo.title.replaceAll("/", "_");
    await fsPromises.writeFile(
      `coverage-playwright/tmp/${testTitle}.json`,
      JSON.stringify({ result: srcCoverage }, null, 2),
    );
  },
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
});

export { expect } from "@playwright/test";
