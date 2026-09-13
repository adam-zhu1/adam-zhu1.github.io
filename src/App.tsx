import { useRoute } from "./lib/router";
import Home from "./pages/Home";
import TrueLinePage from "./pages/TrueLinePage";

/**
 * Two routes. Every one of them is also a real pre-rendered file in dist, so a cold load
 * never depends on this switch — it only takes over once the app is already running,
 * which is what lets the project card morph into its page instead of reloading.
 */
export default function App() {
  const path = useRoute();
  if (path === "/trueline") return <TrueLinePage />;
  return <Home />;
}
