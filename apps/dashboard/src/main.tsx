import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "@rankmyseo/ui/styles.css";
import { App } from "@/App";
import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "@/components/theme-provider";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <App />
      <Toaster />
    </ThemeProvider>
  </StrictMode>,
);
