/**
 * Type definitions copy-pasted from `niivue` since they are not public.
 */

import { DRAG_MODE, SLICE_TYPE } from "@niivue/niivue";

/**
 * Niivue options.
 *
 * Note that there are some inconsistencies with what options are available... In upstream we have:
 *
 * - NiiVueOptions https://github.com/niivue/niivue/blob/4dd7e2b946cdf384e88f76f61657a0ef1531f978/src/niivue/index.ts#L241-L327
 * - NVConfigOptions https://github.com/niivue/niivue/blob/4dd7e2b946cdf384e88f76f61657a0ef1531f978/src/nvdocument.ts#L40-L110
 *
 * There is some overlap between NiiVueOptions and NVConfigOptions
 */
type NiiVueOptions = {
  // the text height for orientation labels (0 to 1). Zero for no text labels
  textHeight?: number;
  // size of colorbar. 0 for no colorbars, fraction of Nifti j dimension
  colorbarHeight?: number;
  // padding around colorbar when displayed
  colorbarMargin?: number;
  // crosshair size. Zero for no crosshair
  crosshairWidth?: number;
  // ruler size. Zero (or isRuler is false) for no ruler
  rulerWidth?: number;
  // the background color. RGBA values from 0 to 1. Default is black
  backColor?: number[];
  // the crosshair color. RGBA values from 0 to 1. Default is red
  crosshairColor?: number[];
  // the font color. RGBA values from 0 to 1. Default is gray
  fontColor?: number[];
  // the selection box color when the intensty selection box is shown (right click and drag). RGBA values from 0 to 1. Default is transparent white
  selectionBoxColor?: number[];
  // the color of the visible clip plane. RGBA values from 0 to 1. Default is white
  clipPlaneColor?: number[];
  // the color of the ruler. RGBA values from 0 to 1. Default is translucent red
  rulerColor?: number[];
  // true/false whether crosshairs are shown on 3D rendering
  show3Dcrosshair?: boolean;
  // whether to trust the nifti header values for cal_min and cal_max. Trusting them results in faster loading because we skip computing these values from the data
  trustCalMinMax?: boolean;
  // the keyboard key used to cycle through clip plane orientations. The default is "c"
  clipPlaneHotKey?: string;
  // the keyboard key used to cycle through view modes. The default is "v"
  viewModeHotKey?: string;
  // the keyUp debounce time in milliseconds. The default is 50 ms. You must wait this long before a new hot-key keystroke will be registered by the event listener
  keyDebounceTime?: number;
  // the maximum time in milliseconds for a double touch to be detected. The default is 500 ms
  doubleTouchTimeout?: number;
  // the minimum time in milliseconds for a touch to count as long touch. The default is 1000 ms
  longTouchTimeout?: number;
  // whether or not to use radiological convention in the display
  isRadiologicalConvention?: boolean;
  // set the logging level to one of: debug, info, warn, error, fatal, silent
  logLevel?: "debug" | "info" | "warn" | "error" | "fatal" | "silent";
  // the loading text to display when there is a blank canvas and no images
  loadingText?: string;
  // whether or not to allow file and url drag and drop on the canvas
  dragAndDropEnabled?: boolean;
  // whether nearest neighbor interpolation is used, else linear interpolation
  isNearestInterpolation?: boolean;
  // whether atlas maps are only visible at the boundary of regions
  isAtlasOutline?: boolean;
  // whether a 10cm ruler is displayed
  isRuler?: boolean;
  // whether colorbar(s) are shown illustrating values for color maps
  isColorbar?: boolean;
  // whether orientation cube is shown for 3D renderings
  isOrientCube?: boolean;
  // spacing between tiles of a multiplanar view
  multiplanarPadPixels?: number;
  // always show rendering in multiplanar view
  multiplanarForceRender?: boolean;
  // 2D slice views can show meshes within this range. Meshes only visible in sliceMM (world space) mode
  meshThicknessOn2D?: number;
  // behavior for dragging (none, contrast, measurement, pan)
  dragMode?: DRAG_MODE;
  // when both voxel-based image and mesh is loaded, will depth picking be able to detect mesh or only voxels
  isDepthPickMesh?: boolean;
  // should slice text be shown in the upper right corner instead of the center of left and top axes?
  isCornerOrientationText?: boolean;
  // should 2D sagittal slices show the anterior direction toward the left or right?
  sagittalNoseLeft?: boolean;
  // are images aligned to voxel space (false) or world space (true)
  isSliceMM?: boolean;
  // demand that high-dot-per-inch displays use native voxel size
  isHighResolutionCapable?: boolean;
  // allow user to create and edit voxel-based drawings
  drawingEnabled?: boolean;
  // color of drawing when user drags mouse (if drawingEnabled)
  penValue?: number;
  // does a voxel have 6 (face), 18 (edge) or 26 (corner) neighbors?
  floodFillNeighbors?: number;
  // number of possible undo steps (if drawingEnabled)
  maxDrawUndoBitmaps?: number;
  // optional 2D png bitmap that can be rapidly loaded to defer slow loading of 3D image
  thumbnail?: string;

  // from NVConfigOptions
  sliceType?: SLICE_TYPE;
};

/**
 * Niivue color map.
 *
 * Documentation: https://github.com/niivue/niivue/blob/main/docs/development-notes/colormaps.md
 *
 * https://github.com/niivue/niivue/blob/bef7941124538e3e593fbce632b7d67826c9bc1e/src/colortables.ts#L4-L14
 */
type ColorMap = {
  R: number[];
  G: number[];
  B: number[];
  A: number[];
  I: number[];

  min?: number;
  max?: number;
  labels?: string[];
};

export type { NiiVueOptions, ColorMap };
