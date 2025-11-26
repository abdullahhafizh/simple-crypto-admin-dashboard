import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import "swiper/swiper-bundle.css";
import "flatpickr/dist/flatpickr.css";
import App from "./App.tsx";
import { AppWrapper } from "./components/common/PageMeta.tsx";
import { ThemeProvider } from "./context/ThemeContext.tsx";
import { AuthProvider } from "./context/AuthContext.tsx";
import UnauthorizedHandler from "./components/auth/UnauthorizedHandler";
import { ToastProvider } from "./components/common/ToastProvider";
import { GlobalLoadingProvider } from "./components/common/GlobalLoadingProvider";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <ThemeProvider>
      <AuthProvider>
        <AppWrapper>
          <GlobalLoadingProvider>
            <ToastProvider>
              <UnauthorizedHandler />
              <App />
            </ToastProvider>
          </GlobalLoadingProvider>
        </AppWrapper>
      </AuthProvider>
    </ThemeProvider>
  </StrictMode>,
);
