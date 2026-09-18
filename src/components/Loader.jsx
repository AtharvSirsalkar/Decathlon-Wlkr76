import { useRef } from "react";
import PropTypes from "prop-types";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";

const INK = "#1c1b18";
const INDIGO = "#3643ba";
const SAGE = "#8ca07c";
const SAND = "#e8c9a6";

// Full-screen preloader shown until every scroll-sequence frame and hero
// asset has finished decoding, so the first scroll is never jittery.
const Loader = ({ progress, ready, onExitComplete }) => {
  const containerRef = useRef(null);
  const logoRef = useRef(null);

  useGSAP(() => {
    gsap.to(logoRef.current, {
      scale: 1.08,
      duration: 1.4,
      ease: "sine.inOut",
      yoyo: true,
      repeat: -1,
    });
  }, []);

  useGSAP(() => {
    if (!ready) return;
    const tl = gsap.timeline({
      delay: 0.35,
      onComplete: () => onExitComplete?.(),
    });
    tl.to(containerRef.current.querySelectorAll("[data-loader-content]"), {
      y: -16,
      opacity: 0,
      duration: 0.5,
      ease: "power2.in",
      stagger: 0.04,
    }).to(
      containerRef.current,
      {
        clipPath: "inset(0% 0% 100% 0%)",
        duration: 1,
        ease: "power4.inOut",
      },
      "-=0.15"
    );
  }, [ready]);

  const pct = Math.round(progress);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-[999] flex items-center justify-center overflow-hidden"
      style={{ backgroundColor: "#f4f1ea", clipPath: "inset(0% 0% 0% 0%)" }}
    >
      <div
        className="pointer-events-none absolute -top-24 -left-24 w-80 h-80 rounded-full blur-3xl animate-drift-a"
        style={{ backgroundColor: `${SAGE}33` }}
      />
      <div
        className="pointer-events-none absolute -bottom-24 -right-16 w-96 h-96 rounded-full blur-3xl animate-drift-b"
        style={{ backgroundColor: `${INDIGO}1a` }}
      />
      <div
        className="pointer-events-none absolute top-1/3 right-1/4 w-56 h-56 rounded-full blur-3xl animate-drift-c"
        style={{ backgroundColor: `${SAND}33` }}
      />

      <div className="relative z-10 flex flex-col items-center">
        <div
          data-loader-content
          className="relative w-24 h-24 flex items-center justify-center"
        >
          <svg
            viewBox="0 0 100 100"
            className="absolute inset-0 w-full h-full animate-spin"
            style={{ animationDuration: "2.4s" }}
          >
            <circle
              cx="50"
              cy="50"
              r="44"
              fill="none"
              stroke={INDIGO}
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray="120 160"
              opacity="0.85"
            />
          </svg>
          <img
            ref={logoRef}
            src="/Decathlon-Symbol.png"
            alt="Decathlon"
            className="w-10 h-auto"
          />
        </div>

        <div
          data-loader-content
          className="mt-6 text-[11px] font-medium tracking-[0.4em] uppercase"
          style={{ color: `${INK}99` }}
        >
          WLKR <span style={{ color: INDIGO }}>&bull;</span> 76
        </div>

        <div
          data-loader-content
          className="mt-8 w-64 h-[3px] rounded-full overflow-hidden"
          style={{ backgroundColor: `${INK}1a` }}
        >
          <div
            className="h-full rounded-full"
            style={{
              width: `${pct}%`,
              background: `linear-gradient(90deg, ${INDIGO}, ${SAGE})`,
              transition: "width 0.25s ease-out",
            }}
          />
        </div>

        <div
          data-loader-content
          className="mt-3 w-64 flex items-center justify-between"
        >
          <span
            className="text-[10px] tracking-[0.25em] uppercase"
            style={{ color: `${INK}73` }}
          >
            Loading experience
          </span>
          <span
            className="text-xs font-semibold tabular-nums"
            style={{ color: `${INK}cc` }}
          >
            {pct}%
          </span>
        </div>
      </div>
    </div>
  );
};

Loader.propTypes = {
  progress: PropTypes.number.isRequired,
  ready: PropTypes.bool.isRequired,
  onExitComplete: PropTypes.func,
};

export default Loader;
