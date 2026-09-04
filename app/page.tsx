import Link from "next/link";

export default function LandingPage() {
  return (
    <main className="flex-1 flex flex-col">
      <div className="mx-auto flex w-full max-w-4xl flex-1 flex-col items-center justify-center px-6 py-24 text-center">
        <span className="mb-6 inline-flex items-center gap-2 rounded-full border border-orange-200 bg-orange-50 px-4 py-1.5 text-sm font-medium text-orange-700">
          🇹🇭 Brandkit · Instant Brand
        </span>

        <h1 className="font-heading text-4xl font-semibold leading-tight text-stone-900 sm:text-5xl md:text-6xl">
          A professional brand in an afternoon
          <span className="block text-orange-600">
            logo, packaging &amp; marketing, in Thai and English
          </span>
        </h1>

        <p className="mt-6 max-w-2xl text-lg text-stone-600">
          บอกเราสั้น ๆ ว่าธุรกิจของคุณคืออะไร แล้วปล่อยให้ AI ช่วยออกแบบชื่อแบรนด์
          โทนสี ฟอนต์ แนวคิดโลโก้ แคปชัน และแท็กไลน์ให้ครบ ทั้งภาษาไทยและอังกฤษ
          ภายในไม่กี่นาที
        </p>

        <Link
          href="/create"
          className="mt-10 inline-flex items-center gap-2 rounded-full bg-orange-600 px-8 py-4 text-lg font-semibold text-white shadow-lg shadow-orange-600/20 transition hover:bg-orange-700 hover:shadow-orange-600/30"
        >
          Start · เริ่มต้นเลย
          <span aria-hidden="true">→</span>
        </Link>

        <div className="mt-16 grid w-full grid-cols-1 gap-4 text-left sm:grid-cols-3">
          {[
            { title: "ชื่อแบรนด์ & แท็กไลน์", desc: "ไอเดียชื่อแบรนด์และประโยคสั้น ๆ ที่จดจำง่าย" },
            { title: "โทนสี & ฟอนต์", desc: "จานสี 5 เฉดพร้อมชื่อ และคู่ฟอนต์ที่เข้ากัน" },
            { title: "โลโก้ & โพสต์โซเชียล", desc: "แนวคิดโลโก้ 3 แบบ พร้อมแคปชันโซเชียล 5 โพสต์" },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-stone-200 bg-white p-5 shadow-sm"
            >
              <p className="font-heading font-semibold text-stone-900">{item.title}</p>
              <p className="mt-1 text-sm text-stone-600">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
