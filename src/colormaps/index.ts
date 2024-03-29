/**
 * Additional color maps generated by https://github.com/niivue/fs2NiiVueColormaps,
 * with a few fixes.
 */

import FreeSurferColorLUTJson from "./FreeSurferColorLUT.json";
import { ColorMap } from "../reexport";

/**
 * Full `FreeSurferColorLUT.txt` label color map.
 */
const FreeSurferColorLUT = Object.freeze(FreeSurferColorLUTJson) as ColorMap;

export { FreeSurferColorLUT };
