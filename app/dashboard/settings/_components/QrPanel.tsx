"use client";

import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";

export function QrPanel({ shopSlug }: { shopSlug: string }) {
  const [origin, setOrigin] = useState("");
  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);
  const url = origin ? `${origin}/s/${shopSlug}` : "";

  return (
    <section className="card">
      <h2 className="mb-3 text-lg font-semibold">Your QR code</h2>
      <p className="mb-3 text-sm text-neutral-500">
        Print this and stick it on the counter. Customers scan → menu → order.
      </p>
      <div className="flex flex-col items-center gap-3">
        {url ? (
          <>
            <div className="rounded-2xl border border-neutral-200 bg-white p-4">
              <QRCodeSVG value={url} size={220} includeMargin />
            </div>
            <code className="break-all text-xs text-neutral-500">{url}</code>
          </>
        ) : (
          <div className="text-sm text-neutral-400">Generating…</div>
        )}
        <button
          type="button"
          className="btn-ghost"
          onClick={() => window.print()}
          disabled={!url}
        >
          Print
        </button>
      </div>
    </section>
  );
}
