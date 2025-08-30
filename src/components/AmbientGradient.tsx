import React from "react";

/****
 Signature Interaction: Ambient gradient that subtly follows the cursor.
 Respects prefers-reduced-motion; falls back to static gradient.
****/
const AmbientGradient: React.FC<{ className?: string }>
 = ({ className }) => {
  React.useEffect(() => {
    const root = document.documentElement;
    const handler = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) * 100 + "%";
      const y = (e.clientY / window.innerHeight) * 100 + "%";
      root.style.setProperty("--mouse-x", x);
      root.style.setProperty("--mouse-y", y);
    };

    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!mq.matches) {
      window.addEventListener("pointermove", handler);
    }
    return () => window.removeEventListener("pointermove", handler);
  }, []);

  return (
    <div
      aria-hidden
      className={
        "pointer-events-none absolute inset-0 [mask-image:radial-gradient(closest-side,black,transparent)] " +
        (className ?? "")
      }
      style={{ background: "var(--gradient-surface)" }}
    />
  );
};

export default AmbientGradient;
