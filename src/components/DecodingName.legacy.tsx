import { useEffect, useRef, useState } from "react";

const TARGET = "Adam Zhu";
const JUMBLE_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%&*";
const STORAGE_KEY = "landingNameDecoded";

function randomChar() {
  return JUMBLE_CHARS[Math.floor(Math.random() * JUMBLE_CHARS.length)];
}

/**
 * Legacy: random jumble resolving letter-by-letter into "Adam Zhu".
 * Replaced on landing by LandingHeroGreeting; kept for reference.
 */
function getInitialState(startDecoding: boolean) {
  const seen =
    typeof sessionStorage !== "undefined" &&
    sessionStorage.getItem(STORAGE_KEY) === "1";
  if (seen || !startDecoding) {
    return { text: TARGET, lockedCount: TARGET.length };
  }
  return {
    text: TARGET.split("").map(() => randomChar()).join(""),
    lockedCount: 0,
  };
}

type DecodingNameLegacyProps = {
  startDecoding?: boolean;
};

export function DecodingNameLegacy({ startDecoding = true }: DecodingNameLegacyProps) {
  const [state, setState] = useState(() => getInitialState(startDecoding));
  const { text, lockedCount } = state;
  const lockedRef = useRef(lockedCount);
  lockedRef.current = lockedCount;

  useEffect(() => {
    if (!startDecoding) return;

    const hasSeen =
      typeof sessionStorage !== "undefined" &&
      sessionStorage.getItem(STORAGE_KEY) === "1";

    if (hasSeen) return;

    setState({
      text: TARGET.split("").map(() => randomChar()).join(""),
      lockedCount: 0,
    });

    const jumbleInterval = setInterval(() => {
      setState((prev) => {
        const arr = prev.text.split("");
        for (let i = lockedRef.current; i < arr.length; i++) {
          arr[i] = randomChar();
        }
        return { ...prev, text: arr.join("") };
      });
    }, 35);

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
  }, [startDecoding]);

  return <span className="decoding-name">{text}</span>;
}
