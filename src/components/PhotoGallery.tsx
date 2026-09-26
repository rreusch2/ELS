import { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, Images, X } from "lucide-react";
import type { ListingPhoto } from "@/lib/types";

export function PhotoGallery({ photos, title }: { photos: ListingPhoto[]; title: string }) {
  const [index, setIndex] = useState<number | null>(null);
  const open = index !== null;

  const prev = useCallback(() => setIndex((i) => (i === null ? i : (i - 1 + photos.length) % photos.length)), [photos.length]);
  const next = useCallback(() => setIndex((i) => (i === null ? i : (i + 1) % photos.length)), [photos.length]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIndex(null);
      if (e.key === "ArrowLeft") prev();
      if (e.key === "ArrowRight") next();
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open, prev, next]);

  if (photos.length === 0) {
    return <div className="grid aspect-[16/9] place-items-center rounded-2xl bg-slate-100 text-slate-400">Photos coming soon</div>;
  }

  const [main, ...rest] = photos;
  const side = rest.slice(0, 4);

  return (
    <>
      <div className="relative grid gap-2 overflow-hidden rounded-2xl md:grid-cols-4 md:grid-rows-2 md:h-[480px]">
        <button
          type="button"
          onClick={() => setIndex(0)}
          className={`group relative overflow-hidden bg-slate-100 ${side.length ? "md:col-span-2 md:row-span-2" : "md:col-span-4 md:row-span-2"} aspect-[4/3] md:aspect-auto`}
        >
          <img src={main.url} alt={title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        </button>
        {side.map((p, i) => (
          <button
            key={p.id}
            type="button"
            onClick={() => setIndex(i + 1)}
            className={`group relative hidden overflow-hidden bg-slate-100 md:block ${side.length < 3 ? "md:row-span-2" : ""} ${side.length === 1 ? "md:col-span-2" : ""}`}
          >
            <img src={p.url} alt="" loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
          </button>
        ))}
        <button
          type="button"
          onClick={() => setIndex(0)}
          className="absolute right-4 bottom-4 flex items-center gap-2 rounded-lg bg-white/95 px-3.5 py-2 text-sm font-semibold text-navy-900 shadow-md hover:bg-white"
        >
          <Images className="h-4 w-4" /> View all {photos.length} photos
        </button>
      </div>

      {open && (
        <div className="fixed inset-0 z-[2000] flex flex-col bg-navy-950/95" role="dialog" aria-modal="true">
          <div className="flex items-center justify-between p-4 text-white">
            <p className="text-sm">{index! + 1} / {photos.length}</p>
            <button type="button" onClick={() => setIndex(null)} className="rounded-full p-2 hover:bg-white/10" aria-label="Close">
              <X className="h-6 w-6" />
            </button>
          </div>
          <div className="relative flex flex-1 items-center justify-center px-4 pb-4">
            <img src={photos[index!].url} alt="" className="max-h-full max-w-full rounded-lg object-contain" />
            {photos.length > 1 && (
              <>
                <button type="button" onClick={prev} className="absolute left-4 rounded-full bg-white/10 p-3 text-white hover:bg-white/20" aria-label="Previous photo">
                  <ChevronLeft className="h-6 w-6" />
                </button>
                <button type="button" onClick={next} className="absolute right-4 rounded-full bg-white/10 p-3 text-white hover:bg-white/20" aria-label="Next photo">
                  <ChevronRight className="h-6 w-6" />
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
