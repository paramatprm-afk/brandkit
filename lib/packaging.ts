export interface PaletteColor {
  hex: string;
  name: string;
}

function hexToRgb(hex: string) {
  const clean = hex.replace("#", "");
  const normalized =
    clean.length === 3
      ? clean
          .split("")
          .map((c) => c + c)
          .join("")
      : clean;
  const value = parseInt(normalized, 16);
  return { r: (value >> 16) & 255, g: (value >> 8) & 255, b: value & 255 };
}

function relativeLuminance({ r, g, b }: { r: number; g: number; b: number }) {
  const [rl, gl, bl] = [r, g, b].map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * rl + 0.7152 * gl + 0.0722 * bl;
}

/**
 * Auto-picks a background / text / accent role for each color in a 5-color
 * brand palette, based on relative luminance, so a label built from an
 * arbitrary generated palette stays legible without any manual input.
 */
export function pickLabelPalette(palette: PaletteColor[]) {
  const withLum = palette.map((c) => ({ ...c, lum: relativeLuminance(hexToRgb(c.hex)) }));
  const sorted = [...withLum].sort((a, b) => b.lum - a.lum);
  const background = sorted[0];
  const text = sorted[sorted.length - 1];
  const accent = sorted[Math.floor(sorted.length / 2)] ?? sorted[0];
  return { background, text, accent };
}

export function slugify(text: string) {
  return (
    text
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9ก-๙]+/gi, "-")
      .replace(/^-+|-+$/g, "") || "brand"
  );
}
