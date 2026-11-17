/* When the visitor was last active on the site, so the arrival can replay only after a break. */
const IDLE = 5 * 60 * 1000, KEY = "st-seen";

export const seenRecently = () => {
  if (typeof location !== "undefined" && new URLSearchParams(location.search).has("boot")) return false;   /* ?boot forces the bootup, for testing */
  try { return Date.now() - Number(localStorage.getItem(KEY) || 0) < IDLE; } catch { return false; }
};
export const touch = () => { try { localStorage.setItem(KEY, String(Date.now())); } catch { /* storage blocked: the arrival just plays each load */ } };
