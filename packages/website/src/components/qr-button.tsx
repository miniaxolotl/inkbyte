"use client";

import { useRef, useState } from "react";
import { QrCode, X, Download } from "lucide-react";

export const QrButton = ({
  slug,
  domain,
}: {
  slug: string;
  domain: string;
}) => {
  const dialog = useRef<HTMLDialogElement>(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState(false);
  const [size, setSize] = useState("1024");
  const [dark, setDark] = useState("#0c2641");
  const query = new URLSearchParams({ slug, domain, dark });
  const href = `/api/inkbyte/qr?${query}`;
  return (
    <>
      <button
        type="button"
        className="ink-button ink-button-quiet min-w-10 px-2 py-1 text-xs"
        aria-label={`Show QR code for ${slug}`}
        title="QR code"
        onClick={() => {
          setOpen(true);
          setError(false);
          dialog.current?.showModal();
        }}
      >
        <QrCode aria-hidden size={16} />
      </button>
      <dialog
        ref={dialog}
        className="ink-card w-[calc(100%-2rem)] max-w-sm p-5 sm:p-6"
        aria-label={`QR code for ${slug}`}
        onClose={() => setOpen(false)}
        onClick={(event) => {
          if (event.target === dialog.current) dialog.current.close();
        }}
      >
        <div className="flex items-center justify-between gap-3">
          <h2 className="font-display text-xl text-cerulean">Your QR code</h2>
          <button
            className="ink-button ink-button-quiet min-w-10 px-2"
            aria-label="Close QR code"
            onClick={() => dialog.current?.close()}
          >
            <X size={16} />
          </button>
        </div>
        <p className="mt-1 break-all text-sm text-ink-soft">
          {domain}/{slug}
        </p>
        {open && !error ? (
          <div className="my-5 rounded-lg border border-rule bg-white p-4">
            {/* SVG is generated at the requested dimensions; optimisation is unnecessary. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`${href}&size=256`}
              width={256}
              height={256}
              alt={`QR code for ${domain}/${slug}`}
              className="mx-auto aspect-square w-full"
              onError={() => setError(true)}
            />
          </div>
        ) : error ? (
          <p role="alert" className="ink-error my-5">
            The QR code could not load. Close this window and retry.
          </p>
        ) : null}
        <div className="grid grid-cols-2 gap-4">
          <label className="ink-label">
            Download size
            <select
              className="ink-input mt-2"
              value={size}
              onChange={(e) => setSize(e.target.value)}
            >
              {[256, 512, 1024, 2048].map((n) => (
                <option key={n} value={n}>
                  {n} px
                </option>
              ))}
            </select>
          </label>
          <label className="ink-label">
            Ink colour
            <input
              aria-label="QR ink colour"
              className="ink-input mt-2"
              type="color"
              value={dark}
              onChange={(e) => setDark(e.target.value)}
            />
          </label>
        </div>
        <a
          href={`${href}&size=${size}`}
          download={`inkbyte-${slug}.svg`}
          className="ink-button mt-5 w-full"
        >
          <Download size={16} aria-hidden />
          Download SVG
        </a>
        <p className="mt-3 text-xs text-ink-faint">
          Choose dark ink for easy scanning. The QR stays the same when you
          update the destination.
        </p>
      </dialog>
    </>
  );
};
