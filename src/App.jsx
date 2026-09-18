import { useCallback, useEffect, useRef, useState } from "react";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import gsap from "gsap";
import Loader from "./components/Loader";

gsap.registerPlugin(ScrollTrigger);

const MAX_INDEX = 650;
const STATIC_ASSETS = [
  "/heroimage/logo-wlkr.webp",
  "/heroimage/hero.jpg",
  "/heroimage/fogg.webp",
];
const TOTAL_ASSETS = MAX_INDEX + STATIC_ASSETS.length;

// How much of the very start of the scroll the hero -> fog dressing takes up.
// The canvas sits underneath as its own always-live z-0 layer (see the JSX
// below), so the sequence itself scrubs from the first pixel of scroll -
// this window is just how long the hero/fog overlay takes to clear off of it.
const INTRO_DRESSING_VH = { blend: 20, clear: 20 };
const SEQUENCE_VH = 1400;
// How much of the very end of the scroll the closing fade-to-black takes up.
const ENDING_FADE_VH = 150;

const App = () => {
  const [progress, setProgress] = useState(0);
  const [assetsReady, setAssetsReady] = useState(false);
  const [loaderMounted, setLoaderMounted] = useState(true);

  const imageObject = useRef([]);
  const canvasref = useRef(null);
  const parentDivRef = useRef(null);
  const heroRef = useRef(null);
  const fogRef = useRef(null);
  const scrollHintRef = useRef(null);
  const endingFadeRef = useRef(null);
  const currentFrame = useRef(1);

  // Preload the entire scroll sequence + hero assets before anything is
  // interactive, so scrubbing never has to draw a half-loaded frame.
  useEffect(() => {
    let cancelled = false;
    let loadedCount = 0;
    let pendingFrame = null;

    const flushProgress = () => {
      pendingFrame = null;
      if (cancelled) return;
      const pct = Math.min(100, (loadedCount / TOTAL_ASSETS) * 100);
      setProgress(pct);
      if (loadedCount >= TOTAL_ASSETS) setAssetsReady(true);
    };

    const onSettled = () => {
      loadedCount += 1;
      if (pendingFrame === null) {
        pendingFrame = requestAnimationFrame(flushProgress);
      }
    };

    const frames = new Array(MAX_INDEX + 1);
    for (let i = 1; i <= MAX_INDEX; i++) {
      const img = new Image();
      img.onload = onSettled;
      img.onerror = onSettled;
      img.src = `/imgs/${i.toString().padStart(3, "0")}.jpg`;
      frames[i] = img;
    }
    imageObject.current = frames;

    STATIC_ASSETS.forEach((src) => {
      const img = new Image();
      img.onload = onSettled;
      img.onerror = onSettled;
      img.src = src;
    });

    return () => {
      cancelled = true;
      if (pendingFrame !== null) cancelAnimationFrame(pendingFrame);
    };
  }, []);

  // Lock scroll until the loader has fully handed off to the real page.
  useEffect(() => {
    document.body.style.overflow = loaderMounted ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [loaderMounted]);

  const drawFrame = useCallback((index) => {
    const canvas = canvasref.current;
    const img = imageObject.current[index];
    if (!canvas || !img || !img.complete || !img.naturalWidth) return;
    const ctx = canvas.getContext("2d");
    const scaleX = canvas.width / img.naturalWidth;
    const scaleY = canvas.height / img.naturalHeight;
    const scale = Math.max(scaleX, scaleY);
    const newWidth = img.naturalWidth * scale;
    const newHeight = img.naturalHeight * scale;
    const offsetX = (canvas.width - newWidth) / 2;
    const offsetY = (canvas.height - newHeight) / 2;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, offsetX, offsetY, newWidth, newHeight);
  }, []);

  // Size the canvas to the viewport (not on every scroll frame) and redraw
  // whatever frame is current whenever the window is resized.
  useEffect(() => {
    const canvas = canvasref.current;
    if (!canvas) return;
    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      drawFrame(currentFrame.current);
    };
    resize();
    window.addEventListener("resize", resize);
    return () => window.removeEventListener("resize", resize);
  }, [drawFrame, assetsReady]);

  useGSAP(
    () => {
      if (!assetsReady) return;

      drawFrame(1);
      gsap.set(fogRef.current, { scale: 1.05 });

      // The canvas is an always-live z-0 layer (see the JSX below), not a
      // separate section the hero/fog have to fully clear before it can
      // start - so the sequence scrubs from the very first pixel of
      // scroll, same as the hero fade. The hero/fog pair is just a dressing
      // overlay fading in and back out on top of it early on: by the time
      // it clears, the shoe is already visibly in motion underneath rather
      // than sitting frozen on frame one waiting for an intro to finish.
      const sequence = { index: 1 };
      gsap
        .timeline({
          scrollTrigger: {
            trigger: parentDivRef.current,
            start: "top top",
            end: "bottom bottom",
            scrub: 1,
          },
        })
        // Hero washes out under the fog overlay...
        .to(
          heroRef.current,
          { opacity: 0, scale: 1.06, ease: "none", duration: INTRO_DRESSING_VH.blend },
          0
        )
        .to(
          fogRef.current,
          { opacity: 1, scale: 1, ease: "none", duration: INTRO_DRESSING_VH.blend },
          0
        )
        // The "scroll" hint only makes sense before scrolling has happened,
        // so it fades away almost immediately once it does.
        .to(scrollHintRef.current, { opacity: 0, ease: "none", duration: 6 }, 0)
        // ...then the fog itself clears, revealing whatever frame the
        // sequence has already reached underneath.
        .to(
          fogRef.current,
          { opacity: 0, ease: "none", duration: INTRO_DRESSING_VH.clear },
          INTRO_DRESSING_VH.blend
        )
        .to(
          sequence,
          {
            index: MAX_INDEX,
            ease: "none",
            duration: SEQUENCE_VH,
            onUpdate: () => {
              currentFrame.current = Math.floor(sequence.index);
              drawFrame(currentFrame.current);
            },
          },
          0
        )
        // Closing fade to black: a gradual scrub-linked dissolve over the
        // last stretch of scroll, reaching full black exactly as the
        // scrollable page ends - not a hard cut, and not a static overlay
        // that's just permanently sitting there.
        .to(
          endingFadeRef.current,
          { opacity: 1, ease: "none", duration: ENDING_FADE_VH },
          SEQUENCE_VH - ENDING_FADE_VH
        );
    },
    { dependencies: [assetsReady] }
  );

  return (
    <>
      {loaderMounted && (
        <Loader
          progress={progress}
          ready={assetsReady}
          onExitComplete={() => setLoaderMounted(false)}
        />
      )}
      <div className="w-full relative">
        <div className="fixed top-[7.6%] left-6 z-50">
          <img
            src="/heroimage/logo-wlkr.webp"
            className="object-cover h-[65px]"
            alt=""
          />
        </div>
        <div ref={parentDivRef} className="w-full h-[1400vh]">
          <div className="w-full h-screen sticky left-0 top-0 overflow-hidden">
            <canvas ref={canvasref} className="absolute inset-0 z-0 w-full h-screen"></canvas>
            <div
              ref={heroRef}
              className="absolute inset-0 z-10 bg-[url('/heroimage/hero.jpg')] bg-cover bg-center"
            ></div>
            <img
              ref={fogRef}
              src="/heroimage/fogg.webp"
              className="absolute inset-0 z-20 opacity-0 w-full h-full object-cover object-center"
              alt=""
            />
            <div
              ref={scrollHintRef}
              className="pointer-events-none absolute bottom-10 left-1/2 z-40 flex -translate-x-1/2 flex-col items-center gap-2"
            >
              <span className="text-[10px] font-medium uppercase tracking-[0.35em] text-white/90 [text-shadow:0_1px_4px_rgba(0,0,0,0.35)]">
                Scroll
              </span>
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="h-4 w-4 text-white/90 [animation-duration:1.8s] animate-bounce drop-shadow-[0_1px_4px_rgba(0,0,0,0.35)]"
              >
                <path d="M6 9l6 6 6-6" />
              </svg>
              <span className="h-9 w-px bg-white/60" />
            </div>
            <div
              ref={endingFadeRef}
              className="pointer-events-none absolute inset-0 z-30 bg-black opacity-0"
            ></div>
          </div>
        </div>
      </div>
    </>
  );
};

export default App;
