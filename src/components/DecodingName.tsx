import { useEffect, useRef, useState } from "react";

const TARGET = "Adam Zhu";
const JUMBLE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%&*";
const STORAGE_KEY = "landingNameDecoded";

function randomChar() {
  return JUMBLE_CHARS[Math.floor(Math.random() * JUMBLE_CHARS.length)];
}

/**
 * First visit: rapid random jumble that slows down and resolves letter-by-letter into "Adam Zhu".
 * Later visits (same session): show name static.
 */
function getInitialState() {
  const seen =
    typeof sessionStorage !== "undefined" &&
    sessionStorage.getItem(STORAGE_KEY) === "1";
  if (seen) {
    return { text: TARGET, lockedCount: TARGET.length };
  }
  return {
    text: TARGET.split("").map(() => randomChar()).join(""),
    lockedCount: 0,
  };
}

export function DecodingName() {
  const [state, setState] = useState(getInitialState);
  const { text, lockedCount } = state;
  const lockedRef = useRef(lockedCount);
  lockedRef.current = lockedCount;

  useEffect(() => {
    const hasSeen =
      typeof sessionStorage !== "undefined" &&
      sessionStorage.getItem(STORAGE_KEY) === "1";

    if (hasSeen) return;

    // Fast jumble: every 35ms, randomize all unlocked positions
    const jumbleInterval = setInterval(() => {
      setState((prev) => {
        const arr = prev.text.split("");
        for (let i = lockedRef.current; i < arr.length; i++) {
          arr[i] = randomChar();
        }
        return { ...prev, text: arr.join("") };
      });
    }, 35);

    // Lock letters one by one with slowing delays (fast → slow)
    const lockDelays = [0, 80, 200, 380, 620, 920, 1280, 1720];
    const timeouts = lockDelays.map((delay, index) =>
      setTimeout(() => {
        lockedRef.current = index + 1;
        setState((prev) => {
          const arr = prev.text.split("");
          arr[index] = TARGET[index];
          return { text: arr.join(""), lockedCount: index + 1 };
        });
        if (index === TARGET.length - 1) {
          sessionStorage.setItem(STORAGE_KEY, "1");
        }
      }, delay),
    );

    return () => {
      clearInterval(jumbleInterval);
      timeouts.forEach((t) => clearTimeout(t));
    };
  }, []);

  return <span className="decoding-name">{text}</span>;
}
