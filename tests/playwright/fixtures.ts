import { test as base, expect } from "playwright-test-coverage-native";
import { NVImage } from "@niivue/niivue";
import { NVROptions, NVRVolume } from "../../src";

type NiivueCanvasTest = {
  getVolume: (name: string) => Promise<NVImage>;
  setVolumes: (volumes: NVRVolume[]) => Promise<void>;

  getOpts: () => Promise<any>; // NVConfigOptions is not a public type
  setOptions: (options: NVROptions) => Promise<void>;
};

type MyFixtures = {
  nvt: NiivueCanvasTest;
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
    const setOptions = async (options: NVROptions) => {
      const counterString = await page
        .getByTestId("options-change-counter")
        .innerText();
      const counterValue = parseInt(counterString);
      await page.getByTestId("options-string").fill(JSON.stringify(options));
      await page.getByTestId("set-options").click();
      await expect(page.getByTestId("options-change-counter")).toHaveText(
        `${counterValue + 1}`,
      );
    };

    const getOpts = async () => {
      const text = await page.getByTestId("nv-opts").innerText();
      return JSON.parse(text);
    };

    const errors: Error[] = [];
    page.on("pageerror", (error) => errors.push(error));

    await page.goto("http://localhost:5173/playwright_harness");
    await use({ setVolumes, getVolume, setOptions, getOpts });
    expect(errors).toHaveLength(0);
  },
});

export { expect } from "@playwright/test";
