import { test as base, expect, Page } from "@playwright/test";
import { NVImage } from "@niivue/niivue";
import { NVRVolume } from "../../src";
import * as fsPromises from "node:fs/promises";
import * as path from "node:path";
import * as url from "node:url";

type NiivueCanvasTest = {
  getVolume: (name: string) => Promise<NVImage>;
  setVolumes: (volumes: NVRVolume[]) => Promise<void>;
};

type MyFixtures = {
  nvt: NiivueCanvasTest;
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
    // Use Playwright's built-in v8 coverage, write to a file
    // https://github.com/microsoft/playwright/issues/9208#issuecomment-1147884893
    await page.coverage.startJSCoverage();
    await use(undefined);

    const coverage = await page.coverage.stopJSCoverage();
    const srcPath = "@fs" + path.normalize(`${__dirname}/../../src`);
    const srcCoverage = coverage
      .filter((entry) => entry.url.includes(srcPath))
      .map((entry) => {
        return { ...entry, url: entry.url.replace(/^.+@fs/, "file://") };
      });
    await fsPromises.mkdir("coverage-playwright", { recursive: true });
    const testTitle = testInfo.title.replaceAll("/", "_");
    await fsPromises.writeFile(
      `coverage-playwright/${testTitle}.json`,
      JSON.stringify({ result: srcCoverage }, null, 2),
    );
  },
});

export { expect } from "@playwright/test";
