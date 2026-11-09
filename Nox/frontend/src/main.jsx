import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import ConsolePage from "./ConsolePage.jsx";
import "./styles.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {window.location.pathname.startsWith("/verilog") ? <ConsolePage /> : <App />}
  </React.StrictMode>
);
