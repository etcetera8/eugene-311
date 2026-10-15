import type { Color } from "@deck.gl/core";

const ORANGES: Color[] = [[253, 208, 162], [253, 174, 107], [253, 141, 60], [241, 105, 19], [217, 72, 1], [140, 45, 4]];
const PURPLES: Color[] = [[218, 218, 235], [188, 189, 220], [158, 154, 200], [128, 125, 186], [106, 81, 163], [74, 20, 134]];
const BLUES: Color[] = [[198, 219, 239], [158, 202, 225], [107, 174, 214], [66, 146, 198], [33, 113, 181], [8, 69, 148]];
const GREENS: Color[] = [[199, 233, 192], [161, 217, 155], [116, 196, 118], [65, 171, 93], [35, 139, 69], [0, 90, 50]];
const DEFAULT: Color[] = [[255, 255, 178], [254, 217, 118], [254, 178, 76], [253, 141, 60], [240, 59, 32], [189, 0, 38]];

const COLOR_RANGES: Record<string, Color[]> = {
    "Pothole": ORANGES,
    "Graffiti": PURPLES,
    "Damaged Sidewalk": BLUES,
    "Abandoned Vehicle": GREENS,
};

export const colorRangeForType = (type: string | null): Color[] =>
    (type && COLOR_RANGES[type]) || DEFAULT;
