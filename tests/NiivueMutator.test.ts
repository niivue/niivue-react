import { expect, it, vi } from "vitest";
import { DRAG_MODE, Niivue, NVImage } from "@niivue/niivue";
import NiivueMutator from "../src/NiivueMutator.ts";

it("reports GL context is ready", () => {
  const nv = new Niivue();
  const nvMutator = new NiivueMutator(nv);
  expect(nvMutator.glIsReady()).toBe(false);
  // @ts-ignore
  vi.spyOn(nv, "gl", "get").mockReturnValue("fake WebGL2RenderingContext");
  expect(nvMutator.glIsReady()).toBe(true);
});

it("uses option setter functions", () => {
  const nv = new Niivue();
  const setCrosshairWidth = vi
    .spyOn(nv, "setCrosshairWidth")
    .mockImplementationOnce(noop);
  const setCrosshairColor = vi
    .spyOn(nv, "setCrosshairColor")
    .mockImplementationOnce(
      // upstream bug: not actually async
      // https://github.com/niivue/niivue/pull/858
      // @ts-ignore
      noop,
    );
  const updateGLVolume = vi
    .spyOn(nv, "updateGLVolume")
    .mockImplementationOnce(noop);
  const nvMutator = new NiivueMutator(nv);

  nvMutator.applyOptions({ crosshairWidth: 5 });
  expect(setCrosshairWidth).toHaveBeenCalledOnce();
  expect(setCrosshairWidth).toHaveBeenLastCalledWith(5);
  expect(setCrosshairColor).not.toHaveBeenCalled();
  expect(updateGLVolume).not.toHaveBeenCalled();
  setCrosshairWidth.mockReset();

  const color = [255, 0, 0];
  nvMutator.applyOptions({ crosshairColor: color });
  expect(setCrosshairColor).toHaveBeenCalledOnce();
  expect(setCrosshairColor).toHaveBeenCalledWith(color);
  expect(setCrosshairWidth).not.toHaveBeenCalled();
  expect(updateGLVolume).not.toHaveBeenCalled();
  setCrosshairColor.mockReset();

  expect(nv.opts.isRadiologicalConvention).toBe(false);
  expect(nv.opts.dragMode).toBe(DRAG_MODE.contrast);
  nvMutator.applyOptions({
    isRadiologicalConvention: true,
    dragMode: DRAG_MODE.measurement,
  });
  expect(nv.opts.isRadiologicalConvention).toBe(true);
  expect(nv.opts.dragMode).toBe(DRAG_MODE.measurement);
  expect(updateGLVolume).toHaveBeenCalledOnce();
  expect(setCrosshairWidth).not.toHaveBeenCalled();
  updateGLVolume.mockReset();

  expect(nv.opts.isOrientCube).toBe(false);
  nvMutator.applyOptions({
    loadingText: "I've got nothing",
    isOrientCube: true,
    overlayOutlineWidth: 10,
    crosshairWidth: 2,
  });
  expect(setCrosshairWidth).toHaveBeenCalledOnce();
  expect(setCrosshairWidth).toHaveBeenLastCalledWith(2);
  expect(nv.opts.loadingText).toBe("I've got nothing");
  expect(nv.opts.isOrientCube).toBe(true);
  expect(nv.overlayOutlineWidth).toBe(10);
  expect(updateGLVolume).toHaveBeenCalledOnce();
});

it("warns about bogus options", () => {
  const nv = new Niivue();
  const nvMutator = new NiivueMutator(nv);
  const consoleMock = vi.spyOn(console, "warn").mockImplementation(noop);

  nvMutator.applyOptions({
    // @ts-ignore
    bogusOption: "whale whale whale, what do we have here",
  });

  expect(consoleMock).toHaveBeenCalledOnce();
  expect(consoleMock).toHaveBeenCalledWith(
    'Don\'t know how to handle bogusOption="whale whale whale, what do we have here"',
  );
});

it("can load volumes", async () => {
  const nv = new Niivue();
  const loadVolumes = vi
    .spyOn(nv, "loadVolumes")
    .mockImplementation(async () => nv);
  const nvMutator = new NiivueMutator(nv);

  const volumes = [
    {
      url: "https://example.com/ventricles.nii.gz",
      opacity: 0.5,
    },
    {
      url: "https://example.com/brain.nii.gz",
    },
  ];

  await nvMutator.loadVolumes(volumes);
  expect(loadVolumes).toHaveBeenCalledOnce();
  expect(loadVolumes.mock.lastCall).toStrictEqual([volumes]);
});

it("can load volumes with modulation image", async () => {
  const volumes = [
    {
      url: "https://example.com/images/mean_func.nii.gz",
      opacity: 1,
      colormap: "gray",
    },
    {
      url: "https://example.com/images/cope1.nii.gz",
      colormap: "winter",
      opacity: 1,
      cal_min: 0.0,
      cal_max: 100,
      modulationImageUrl: "https://example.com/images/tstat1.nii.gz",
      modulateAlpha: 1,
    },
    {
      url: "https://example.com/images/tstat1.nii.gz",
      opacity: 0,
      colormap: "warm",
      cal_min: 0,
      cal_max: 4.5,
    },
  ];

  const volumesWithoutModulationFields = [
    {
      url: "https://example.com/images/mean_func.nii.gz",
      opacity: 1,
      colormap: "gray",
    },
    {
      url: "https://example.com/images/cope1.nii.gz",
      colormap: "winter",
      opacity: 1,
      cal_min: 0.0,
      cal_max: 100,
    },
    {
      url: "https://example.com/images/tstat1.nii.gz",
      opacity: 0,
      colormap: "warm",
      cal_min: 0,
      cal_max: 4.5,
    },
  ];
  const nvVolumes: { [key: string]: { id: string } } = {
    "https://example.com/images/mean_func.nii.gz": {
      id: "mean_func-uuid",
    },
    "https://example.com/images/tstat1.nii.gz": {
      id: "tstat1-uuid",
    },
    "https://example.com/images/cope1.nii.gz": {
      id: "cope1-uuid",
    },
  };

  const nv = new Niivue();
  const loadVolumes = vi
    .spyOn(nv, "loadVolumes")
    .mockImplementation(async () => nv);
  const setModulationImage = vi
    .spyOn(nv, "setModulationImage")
    .mockImplementation(noop);
  vi.spyOn(nv, "volumes", "get").mockReturnValue(
    Object.values(nvVolumes) as NVImage[],
  );
  vi.spyOn(nv, "getMediaByUrl").mockImplementation((url) => {
    return nvVolumes[url] as NVImage;
  });
  vi.spyOn(nv, "updateGLVolume").mockImplementation(noop);
  const nvMutator = new NiivueMutator(nv);

  await nvMutator.loadVolumes(volumes);
  expect(loadVolumes).toHaveBeenCalledOnce();
  expect(loadVolumes.mock.lastCall).toStrictEqual([
    volumesWithoutModulationFields,
  ]);
  expect(setModulationImage).toHaveBeenCalledOnce();
  expect(setModulationImage).toHaveBeenCalledWith(
    "cope1-uuid",
    "tstat1-uuid",
    1,
  );
  setModulationImage.mockReset();

  nvMutator.applyVolumeChanges({
    url: "https://example.com/images/cope1.nii.gz",
    cal_max: 70,
    modulationImageUrl: null,
  });
  expect(setModulationImage).toHaveBeenCalledOnce();
  expect(setModulationImage).toHaveBeenCalledWith("cope1-uuid", null, 0);
  expect(nv.volumes[2].cal_max).toBe(70);
});

it("warns if modulationImageUrl does not refer to a valid volume", async () => {
  const volumes = [
    {
      url: "https://example.com/images/mean_func.nii.gz",
      opacity: 1,
      colormap: "gray",
    },
    {
      url: "https://example.com/images/cope1.nii.gz",
      colormap: "winter",
      opacity: 1,
      cal_min: 0.0,
      cal_max: 100,
      modulationImageUrl: "https://example.com/images/tstat1.nii.gz",
      modulateAlpha: 1,
    },
  ];
  const nvVolumes: { [key: string]: { id: string } } = {
    "https://example.com/images/mean_func.nii.gz": {
      id: "mean_func-uuid",
    },
    "https://example.com/images/cope1.nii.gz": {
      id: "cope1-uuid",
    },
  };

  const nv = new Niivue();
  const loadVolumes = vi
    .spyOn(nv, "loadVolumes")
    .mockImplementation(async () => nv);
  const setModulationImage = vi
    .spyOn(nv, "setModulationImage")
    .mockImplementation(noop);
  vi.spyOn(nv, "getMediaByUrl").mockImplementation((url) => {
    return nvVolumes[url] as NVImage;
  });
  const consoleMock = vi.spyOn(console, "warn").mockImplementation(noop);
  const nvMutator = new NiivueMutator(nv);

  await nvMutator.loadVolumes(volumes);
  expect(loadVolumes).toHaveBeenCalledOnce();
  expect(setModulationImage).not.toHaveBeenCalledOnce();
  expect(consoleMock).toHaveBeenCalledOnce();
  expect(consoleMock).toHaveBeenCalledWith(
    "modulationImageUrl not found in volumes: https://example.com/images/tstat1.nii.gz",
  );
});

it("errors if changing a volume which is not loaded", async () => {
  const volumes = [
    {
      url: "https://example.com/images/mean_func.nii.gz",
    },
    {
      url: "https://example.com/images/cope1.nii.gz",
    },
  ];
  const nvVolumes: { [key: string]: { id: string } } = {
    "https://example.com/images/mean_func.nii.gz": {
      id: "mean_func-uuid",
    },
    "https://example.com/images/cope1.nii.gz": {
      id: "cope1-uuid",
    },
  };

  const nv = new Niivue();
  vi.spyOn(nv, "loadVolumes").mockImplementation(async () => nv);
  vi.spyOn(nv, "getMediaByUrl").mockImplementation((url) => {
    return nvVolumes[url] as NVImage;
  });
  vi.spyOn(nv, "volumes", "get").mockReturnValue(
    Object.values(nvVolumes) as NVImage[],
  );
  const updateGLVolume = vi
    .spyOn(nv, "updateGLVolume")
    .mockImplementationOnce(noop);
  const nvMutator = new NiivueMutator(nv);

  await nvMutator.loadVolumes(volumes);
  nvMutator.applyVolumeChanges({
    url: "https://example.com/images/mean_func.nii.gz",
    cal_max: 50,
  });
  expect(updateGLVolume).toHaveBeenCalledOnce();
  expect(nv.volumes[0].cal_max).toBe(50);

  expect(() => {
    nvMutator.applyVolumeChanges({
      url: "https://example.com/notloaded.nii.gz",
      cal_max: 50,
    });
  }).toThrowError(
    "No volume found with URL https://example.com/notloaded.nii.gz",
  );
});

it("uses volume property setter methods", async () => {
  const volumes = [
    {
      url: "https://example.com/images/mean_func.nii.gz",
    },
    {
      url: "https://example.com/images/cope1.nii.gz",
    },
  ];
  const nvVolumes: { [key: string]: { id: string } } = {
    "https://example.com/images/mean_func.nii.gz": {
      id: "mean_func-uuid",
    },
    "https://example.com/images/cope1.nii.gz": {
      id: "cope1-uuid",
    },
  };

  const nv = new Niivue();
  vi.spyOn(nv, "loadVolumes").mockImplementation(async () => nv);
  vi.spyOn(nv, "getMediaByUrl").mockImplementation((url) => {
    return nvVolumes[url] as NVImage;
  });
  vi.spyOn(nv, "volumes", "get").mockReturnValue(
    Object.values(nvVolumes) as NVImage[],
  );
  vi.spyOn(nv, "updateGLVolume").mockImplementationOnce(noop);
  const setOpacity = vi.spyOn(nv, "setOpacity").mockImplementation(noop);
  const setColormap = vi.spyOn(nv, "setColormap").mockImplementation(noop);

  const nvMutator = new NiivueMutator(nv);
  await nvMutator.loadVolumes(volumes);

  nvMutator.applyVolumeChanges({
    url: "https://example.com/images/cope1.nii.gz",
    colormap: "blue",
  });
  expect(setColormap).toHaveBeenCalledOnce();
  expect(setColormap).toHaveBeenCalledWith("cope1-uuid", "blue");
  expect(nv.updateGLVolume).not.toHaveBeenCalled(); // not called bc the mock is a no-op

  nvMutator.applyVolumeChanges({
    url: "https://example.com/images/mean_func.nii.gz",
    opacity: 0.7,
  });
  expect(setOpacity).toHaveBeenCalledOnce();
  expect(setOpacity).toHaveBeenCalledWith(0, 0.7);
  expect(nv.updateGLVolume).not.toHaveBeenCalled(); // not called bc the mock is a no-op
});

function noop() {}

async function asyncNoop() {}
