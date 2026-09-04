"use client";

import { useRef, useState } from "react";
import type { BrandKitResult, LogoImage } from "@/lib/brandkit";
import { googleFontsUrl } from "@/lib/brandkit";
import { pickLabelPalette, slugify } from "@/lib/packaging";
import { renderSvgToCanvas, downloadBlob } from "@/lib/svg-export";
import { UpgradeButton } from "@/components/UpgradeButton";

const LABEL_WIDTH = 400;
const LABEL_HEIGHT = 560;
const EXPORT_SCALE = 3;

export function PackagingLabel({
  result,
  businessName,
  logo,
  isPro,
}: {
  result: BrandKitResult;
  businessName: string | null;
  logo: LogoImage;
  isPro: boolean;
}) {
  const [productName, setProductName] = useState("");
  const [size, setSize] = useState("");
  const [exporting, setExporting] = useState<"png" | "pdf" | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const brandName = businessName?.trim() || result.brandNameIdeas[0] || "Brand";
  const colors = pickLabelPalette(result.palette);

  async function handleExport(format: "png" | "pdf") {
    if (!svgRef.current || !isPro) return;
    setExporting(format);
    setExportError(null);
    try {
      const canvas = await renderSvgToCanvas(svgRef.current, {
        width: LABEL_WIDTH,
        height: LABEL_HEIGHT,
        scale: EXPORT_SCALE,
        fonts: result.fonts,
      });
      const filename = `${slugify(brandName)}-label`;

      if (format === "png") {
        await new Promise<void>((resolve, reject) => {
          canvas.toBlob((blob) => {
            if (!blob) {
              reject(new Error("สร้างไฟล์ PNG ไม่สำเร็จ"));
              return;
            }
            downloadBlob(blob, `${filename}.png`);
            resolve();
          }, "image/png");
        });
      } else {
        const { jsPDF } = await import("jspdf");
        const pdfWidth = canvas.width / EXPORT_SCALE;
        const pdfHeight = canvas.height / EXPORT_SCALE;
        const pdf = new jsPDF({
          orientation: pdfWidth >= pdfHeight ? "landscape" : "portrait",
          unit: "pt",
          format: [pdfWidth, pdfHeight],
        });
        pdf.addImage(canvas.toDataURL("image/png"), "PNG", 0, 0, pdfWidth, pdfHeight);
        pdf.save(`${filename}.pdf`);
      }
    } catch (err) {
      setExportError(err instanceof Error ? err.message : "ส่งออกไฟล์ไม่สำเร็จ กรุณาลองใหม่");
    } finally {
      setExporting(null);
    }
  }

  return (
    <div className="flex flex-col gap-8 lg:flex-row lg:items-start">
      <link rel="stylesheet" href={googleFontsUrl(result.fonts)} />

      <div className="flex flex-1 flex-col items-center gap-5">
        <svg
          ref={svgRef}
          viewBox={`0 0 ${LABEL_WIDTH} ${LABEL_HEIGHT}`}
          width={LABEL_WIDTH}
          height={LABEL_HEIGHT}
          role="img"
          aria-label={`Product label for ${brandName}`}
          className="w-full max-w-sm overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-sm"
        >
          <rect
            x={0}
            y={0}
            width={LABEL_WIDTH}
            height={LABEL_HEIGHT}
            fill={colors.background.hex}
            stroke={colors.accent.hex}
            strokeWidth={4}
          />

          {logo ? (
            <>
              <defs>
                <clipPath id="brandkit-logo-clip">
                  <circle cx={LABEL_WIDTH / 2} cy={104} r={54} />
                </clipPath>
              </defs>
              <circle
                cx={LABEL_WIDTH / 2}
                cy={104}
                r={57}
                fill="#ffffff"
                stroke={colors.accent.hex}
                strokeWidth={2}
              />
              <image
                href={logo}
                x={LABEL_WIDTH / 2 - 54}
                y={50}
                width={108}
                height={108}
                clipPath="url(#brandkit-logo-clip)"
                preserveAspectRatio="xMidYMid slice"
              />
            </>
          ) : (
            <>
              <circle cx={LABEL_WIDTH / 2} cy={104} r={54} fill={colors.accent.hex} />
              <text
                x={LABEL_WIDTH / 2}
                y={122}
                textAnchor="middle"
                fontSize={46}
                fontWeight={700}
                fontFamily={`"${result.fonts.heading}", sans-serif`}
                fill={colors.background.hex}
              >
                {(brandName.trim().charAt(0) || "B").toUpperCase()}
              </text>
            </>
          )}

          <text
            x={LABEL_WIDTH / 2}
            y={205}
            textAnchor="middle"
            fontSize={30}
            fontWeight={700}
            fontFamily={`"${result.fonts.heading}", sans-serif`}
            fill={colors.text.hex}
          >
            {brandName}
          </text>

          <text
            x={LABEL_WIDTH / 2}
            y={230}
            textAnchor="middle"
            fontSize={13}
            fontStyle="italic"
            fontFamily={`"${result.fonts.body}", sans-serif`}
            fill={colors.text.hex}
            fillOpacity={0.75}
          >
            {result.tagline.th}
          </text>

          <line
            x1={64}
            y1={262}
            x2={LABEL_WIDTH - 64}
            y2={262}
            stroke={colors.accent.hex}
            strokeWidth={2}
          />

          <text
            x={LABEL_WIDTH / 2}
            y={336}
            textAnchor="middle"
            fontSize={34}
            fontWeight={600}
            fontFamily={`"${result.fonts.body}", sans-serif`}
            fill={colors.text.hex}
          >
            {productName || "ชื่อสินค้า"}
          </text>

          <text
            x={LABEL_WIDTH / 2}
            y={368}
            textAnchor="middle"
            fontSize={16}
            fontFamily={`"${result.fonts.body}", sans-serif`}
            fill={colors.text.hex}
            fillOpacity={0.7}
          >
            {size || "ขนาดสุทธิ"}
          </text>

          {result.palette.map((color, i) => {
            const spacing = 28;
            const startX = LABEL_WIDTH / 2 - ((result.palette.length - 1) * spacing) / 2;
            return (
              <circle
                key={color.hex}
                cx={startX + i * spacing}
                cy={LABEL_HEIGHT - 66}
                r={9}
                fill={color.hex}
                stroke="#ffffff"
                strokeWidth={1.5}
              />
            );
          })}

          <text
            x={LABEL_WIDTH / 2}
            y={LABEL_HEIGHT - 26}
            textAnchor="middle"
            fontSize={11}
            fontFamily={`"${result.fonts.body}", sans-serif`}
            fill={colors.text.hex}
            fillOpacity={0.6}
          >
            {result.tagline.en}
          </text>
        </svg>

        {isPro ? (
          <div className="flex flex-wrap items-center justify-center gap-3">
            <button
              onClick={() => handleExport("png")}
              disabled={exporting !== null}
              className="rounded-full bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {exporting === "png" ? "กำลังส่งออก…" : "ดาวน์โหลด PNG"}
            </button>
            <button
              onClick={() => handleExport("pdf")}
              disabled={exporting !== null}
              className="rounded-full border border-stone-300 bg-white px-5 py-2.5 text-sm font-semibold text-stone-700 shadow-sm transition hover:border-orange-400 hover:text-orange-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {exporting === "pdf" ? "กำลังส่งออก…" : "ดาวน์โหลด PDF"}
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 rounded-2xl border border-orange-200 bg-orange-50 px-6 py-4 text-center">
            <p className="text-sm text-stone-700">
              อัปเกรดเป็น Pro เพื่อดาวน์โหลดฉลากเป็น PNG และ PDF
            </p>
            <UpgradeButton />
          </div>
        )}
        {exportError && <p className="text-sm text-red-600">{exportError}</p>}
      </div>

      <div className="w-full flex-shrink-0 rounded-2xl border border-stone-200 bg-white p-5 shadow-sm lg:w-72">
        <h3 className="font-heading font-semibold text-stone-900">แก้ไขข้อมูลสินค้า · Edit product</h3>
        <p className="mt-1 text-xs text-stone-500">
          ฉลากด้านซ้ายเติมชื่อแบรนด์ โทนสี และฟอนต์ให้อัตโนมัติจากแบรนด์คิทนี้ — กรอกแค่ชื่อสินค้าและขนาด
        </p>

        <label className="mt-5 flex flex-col gap-1.5">
          <span className="text-sm font-medium text-stone-900">ชื่อสินค้า · Product name</span>
          <input
            type="text"
            value={productName}
            onChange={(e) => setProductName(e.target.value)}
            placeholder="เช่น น้ำผึ้งดอกลำไย"
            maxLength={40}
            className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 placeholder:text-stone-400 shadow-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
          />
        </label>

        <label className="mt-4 flex flex-col gap-1.5">
          <span className="text-sm font-medium text-stone-900">ขนาด · Size</span>
          <input
            type="text"
            value={size}
            onChange={(e) => setSize(e.target.value)}
            placeholder="เช่น 250 ml"
            maxLength={24}
            className="w-full rounded-xl border border-stone-300 bg-white px-3 py-2 text-sm text-stone-900 placeholder:text-stone-400 shadow-sm outline-none transition focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20"
          />
        </label>
      </div>
    </div>
  );
}
