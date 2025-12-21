import { createRoot } from "react-dom/client";
import App from "./App";
import "./main.css";

const rootElement = document.getElementById("app");
if (!rootElement) {
  throw new Error("Missing root element");
}

createRoot(rootElement).render(<App />);
