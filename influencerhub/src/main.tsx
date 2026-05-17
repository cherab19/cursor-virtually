import { QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "react-helmet-async";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Toaster } from "sonner";

import { App } from "@/App";
import "@/index.css";
import { queryClient } from "@/lib/query-client";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <App />
        <Toaster
          position="top-right"
          closeButton
          toastOptions={{
            classNames: {
              toast: "border border-border bg-card text-card-foreground shadow-card",
              title: "font-medium text-card-foreground",
              description: "text-muted-foreground",
              closeButton: "text-muted-foreground hover:text-foreground",
            },
          }}
        />
      </QueryClientProvider>
    </HelmetProvider>
  </StrictMode>,
);
