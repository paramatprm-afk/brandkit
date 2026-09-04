"use client";

import { useState, type ReactNode } from "react";
import { BrandKitSections } from "@/components/BrandKitSections";
import { PackagingLabel } from "@/components/PackagingLabel";
import type { BrandKitResult, LogoImage } from "@/lib/brandkit";

export function BrandTabs({
  result,
  initialLogos,
  businessName,
}: {
  result: BrandKitResult;
  initialLogos?: LogoImage[] | null;
  businessName: string | null;
}) {
  const [tab, setTab] = useState<"kit" | "packaging">("kit");
  const firstLogo = initialLogos?.find((logo): logo is string => Boolean(logo)) ?? null;

  return (
    <div className="flex flex-col gap-10">
      <div className="flex gap-2 border-b border-stone-200">
        <TabButton active={tab === "kit"} onClick={() => setTab("kit")}>
          แบรนด์คิท · Brand Kit
        </TabButton>
        <TabButton active={tab === "packaging"} onClick={() => setTab("packaging")}>
          แพ็กเกจจิ้ง · Packaging
        </TabButton>
      </div>

      {tab === "kit" ? (
        <div className="flex flex-col gap-14">
          <BrandKitSections result={result} initialLogos={initialLogos} />
        </div>
      ) : (
        <PackagingLabel result={result} businessName={businessName} logo={firstLogo} />
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-medium transition ${
        active
          ? "border-orange-600 text-orange-700"
          : "border-transparent text-stone-500 hover:text-stone-700"
      }`}
    >
      {children}
    </button>
  );
}
