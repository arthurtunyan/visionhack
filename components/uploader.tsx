"use client";

import { useCallback, useRef, useState } from "react";
import type { UiCopy } from "@/lib/ui-copy";

interface UploaderProps {
  copy: UiCopy;
  storeName: string;
  onStoreNameChange: (value: string) => void;
  onScan: (file: File) => void;
  onLoadSample: () => void;
  scanning: boolean;
}

const ACCEPT = "image/jpeg,image/png,image/webp,image/gif";

export function Uploader({
  copy,
  storeName,
  onStoreNameChange,
  onScan,
  onLoadSample,
  scanning,
}: UploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const accept = useCallback((next: File | null) => {
    setFile(next);
    setPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return next ? URL.createObjectURL(next) : null;
    });
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const dropped = e.dataTransfer.files?.[0];
      if (dropped && dropped.type.startsWith("image/")) accept(dropped);
    },
    [accept],
  );

  return (
    <div className="flex flex-col gap-6">
      <div>
        <label htmlFor="store-name" className="mb-2 block font-mono text-xs uppercase tracking-widest text-muted-foreground">
          {copy.storeNameLabel}
        </label>
        <input
          id="store-name"
          type="text"
          value={storeName}
          onChange={(e) => onStoreNameChange(e.target.value)}
          placeholder={copy.storeNamePlaceholder}
          className="w-full border border-hairline bg-paper px-4 py-3 text-base text-ink outline-none transition-colors placeholder:text-muted-foreground focus:border-blue"
        />
      </div>

      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`relative flex flex-col items-center justify-center gap-4 border border-dashed px-6 py-12 text-center transition-colors ${
          dragging ? "border-blue bg-muted" : "border-hairline"
        }`}
      >
        {/* Bracket corners — the brand mark's motif, blue, framing the drop area. */}
        <Bracket className="left-2 top-2 border-l-2 border-t-2" />
        <Bracket className="right-2 top-2 border-r-2 border-t-2" />
        <Bracket className="bottom-2 left-2 border-b-2 border-l-2" />
        <Bracket className="bottom-2 right-2 border-b-2 border-r-2" />

        {preview ? (
          <img
            src={preview || "/placeholder.svg"}
            alt=""
            className="max-h-48 w-auto border border-hairline object-contain"
          />
        ) : (
          <p className="max-w-xs text-pretty text-sm text-muted-foreground">{copy.dropHere}</p>
        )}

        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT}
          className="sr-only"
          onChange={(e) => accept(e.target.files?.[0] ?? null)}
        />
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="border border-ink px-4 py-2 font-mono text-xs uppercase tracking-widest text-ink transition-colors hover:bg-ink hover:text-paper"
        >
          {file ? file.name.slice(0, 28) : copy.chooseFile}
        </button>
      </div>

      <p className="text-xs leading-relaxed text-muted-foreground">{copy.uploadHint}</p>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={!file || scanning}
          onClick={() => file && onScan(file)}
          className="flex items-center gap-2 bg-blue px-6 py-3 font-mono text-xs uppercase tracking-widest text-primary-foreground transition-opacity disabled:cursor-not-allowed disabled:opacity-40"
        >
          {scanning ? (
            <>
              <span className="inline-block h-3 w-3 animate-spin border-2 border-primary-foreground border-t-transparent" />
              {copy.scanning}
            </>
          ) : (
            copy.scan
          )}
        </button>
        <button
          type="button"
          onClick={onLoadSample}
          className="font-mono text-xs uppercase tracking-widest text-blue underline underline-offset-4 transition-opacity hover:opacity-70"
        >
          {copy.loadSample}
        </button>
      </div>
    </div>
  );
}

function Bracket({ className }: { className?: string }) {
  return <span aria-hidden className={`pointer-events-none absolute h-5 w-5 border-blue ${className}`} />;
}
