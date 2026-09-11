import { useEffect, useState } from "react";
import { A } from "../lib/router";

function useClock() {
  const [t, setT] = useState("");
  useEffect(() => {
    const tick = () => setT(new Date().toLocaleTimeString("en-US", { timeZone: "America/New_York", hour12: false }));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return t;
}

/**
 * The top bar, identical on every route. The mark goes to the top of the current page on
 * home and back to the work from a project page, so it is always "up one level".
 */
export function Bar({ home = true }: { home?: boolean }) {
  const clock = useClock();
  return (
    <div className="bar">
      <A className="mark" href={home ? "#adam" : "/#projects"}
         aria-label={home ? "Adam Zhu, back to the top" : "Adam Zhu, back to the work"}>
        <svg viewBox="0 0 24 24" aria-hidden="true">
          <path className="arc" d="M12 3.4 A8.6 8.6 0 1 1 8.83 19.6" fill="none" stroke="var(--frame)" strokeWidth="1.7" strokeLinecap="round" />
          <g className="az" fill="currentColor" transform="translate(12 12.6) scale(.236) translate(-33 -31)">
            <path d="M12 44 L20.5 18 L27.5 18 L36 44 L29.4 44 L27.7 38.2 L20.3 38.2 L18.6 44 Z M21.9 32.6 L26.1 32.6 L24 25.4 Z" />
            <path d="M36.5 18 L54 18 L54 23.6 L44.2 38.4 L54 38.4 L54 44 L36 44 L36 38.4 L45.8 23.6 L36.5 23.6 Z" />
          </g>
          <circle className="today" cx="12" cy="3.4" r="1.8" />
        </svg>
        <span>Adam Zhu</span>
      </A>
      <span className="clock">Pittsburgh {clock}</span>
    </div>
  );
}

export { useClock };
