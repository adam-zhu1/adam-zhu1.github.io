import { useEffect } from "react";
import { useRoute } from "./lib/router";
import Home from "./pages/Home";
import TrueLinePage from "./pages/TrueLinePage";
import Studio from "./concepts/Studio";

/* draft-only: ?concept=studio shows the draft in place of the home page */
const CONCEPT = typeof location === "undefined" ? null : new URLSearchParams(location.search).get("concept");

/* the same titles the prerender writes, so moving between the routes in-app matches a cold load */
const TITLES: Record<string, string> = {
  "/": "Adam Zhu | Statistics & Machine Learning, Carnegie Mellon",
  "/trueline": "TrueLine | A bowling ball tracker for iPhone, by Adam Zhu",
};

/**
 * Two routes. Every one of them is also a real pre-rendered file in dist, so a cold load
 * never depends on this switch — it only takes over once the app is already running,
 * which is what lets the project card morph into its page instead of reloading.
 */
export default function App() {
  const path = useRoute();
  useEffect(() => { document.title = TITLES[path] ?? TITLES["/"]; }, [path]);
  if (path === "/trueline") return <TrueLinePage />;
  if (CONCEPT === "studio") return <Studio />;
  return <Home />;
}
