import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./assets/index.css";

const rootElement = document.getElementById("root");
if (rootElement) {
  ReactDOM.createRoot(rootElement).render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
} else {
  throw new Error('Elemento "root" não encontrado no documento.');
}