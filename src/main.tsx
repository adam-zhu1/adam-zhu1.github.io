import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

/** Remove the static crawler/AI fallback so JS users (and screen readers) don't get duplicate content. */
document.getElementById("seo-fallback")?.remove();

createRoot(document.getElementById("root")!).render(<App />);
