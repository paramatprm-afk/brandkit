/**
 * Rasterizes a live SVG element to a <canvas>, with the given Google Fonts
 * embedded as base64 data URIs inside the SVG first.
 *
 * Why: an <img>/blob rendering of an SVG is an isolated context that does
 * NOT pick up the page's own <link> stylesheet, so any custom webfont used
 * by the SVG's <text> would silently fall back to a system font on export.
 * Embedding the font data directly in the SVG (and keeping every other
 * reference, like a logo <image>, as a data URI too) also keeps the source
 * fully self-contained, which avoids tainting the canvas so toBlob/
 * toDataURL keep working.
 */
export async function renderSvgToCanvas(
  svg: SVGSVGElement,
  options: { width: number; height: number; scale: number; fonts: { heading: string; body: string } },
) {
  const { width, height, scale, fonts } = options;

  const clone = svg.cloneNode(true) as SVGSVGElement;
  clone.setAttribute("width", String(width));
  clone.setAttribute("height", String(height));
  clone.setAttribute("xmlns", "http://www.w3.org/2000/svg");

  const fontCss = await buildEmbeddedFontCss(fonts);
  const styleEl = document.createElementNS("http://www.w3.org/2000/svg", "style");
  styleEl.textContent = fontCss;
  clone.insertBefore(styleEl, clone.firstChild);

  const svgString = new XMLSerializer().serializeToString(clone);
  const svgBlob = new Blob([svgString], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(svgBlob);

  try {
    const img = await loadImage(url);
    const canvas = document.createElement("canvas");
    canvas.width = width * scale;
    canvas.height = height * scale;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("เบราว์เซอร์นี้ไม่รองรับ Canvas");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("โหลดตัวอย่างฉลากไม่สำเร็จ"));
    img.src = src;
  });
}

async function buildEmbeddedFontCss(fonts: { heading: string; body: string }) {
  const families = Array.from(new Set([fonts.heading, fonts.body]));
  const cssUrl = `https://fonts.googleapis.com/css2?${families
    .map((f) => `family=${encodeURIComponent(f)}:wght@400;600;700`)
    .join("&")}&display=swap`;

  const res = await fetch(cssUrl);
  if (!res.ok) throw new Error("โหลดฟอนต์สำหรับส่งออกไม่สำเร็จ");
  let css = await res.text();

  const fontUrls = Array.from(new Set(Array.from(css.matchAll(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/g)).map((m) => m[1])));

  const replacements = await Promise.all(
    fontUrls.map(async (fontUrl) => {
      const fontRes = await fetch(fontUrl);
      const buf = await fontRes.arrayBuffer();
      const mime = fontUrl.endsWith(".woff2") ? "font/woff2" : "font/woff";
      return [fontUrl, `data:${mime};base64,${arrayBufferToBase64(buf)}`] as const;
    }),
  );

  for (const [original, dataUri] of replacements) {
    css = css.split(original).join(dataUri);
  }

  return css;
}

function arrayBufferToBase64(buffer: ArrayBuffer) {
  let binary = "";
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
