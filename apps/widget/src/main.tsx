import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./style.css";
import { App } from "./App";

const container = document.getElementById("concierge-root");
if (container === null) {
  throw new Error("#concierge-root mount element missing");
}

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>
);
