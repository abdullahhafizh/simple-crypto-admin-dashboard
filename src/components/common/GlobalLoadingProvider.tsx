import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

interface GlobalLoadingContextValue {
  startLoading: () => void;
  stopLoading: () => void;
  isLoading: boolean;
}

const GlobalLoadingContext =
  createContext<GlobalLoadingContextValue | undefined>(undefined);

export function GlobalLoadingProvider({ children }: { children: ReactNode }) {
  const [count, setCount] = useState(0);

  const startLoading = useCallback(() => {
    setCount((prev) => prev + 1);
  }, []);

  const stopLoading = useCallback(() => {
    setCount((prev) => (prev > 0 ? prev - 1 : 0));
  }, []);

  const isLoading = count > 0;

  return (
    <GlobalLoadingContext.Provider value={{ startLoading, stopLoading, isLoading }}>
      {children}
      {/* Simple top loading bar */}
      <div className="pointer-events-none fixed inset-x-0 top-0 z-[9998] h-0.5">
        <div
          className={`h-full w-full origin-left bg-brand-500 transition-transform duration-300 ${
            isLoading ? "scale-x-100" : "scale-x-0"
          }`}
        />
      </div>
    </GlobalLoadingContext.Provider>
  );
}

export function useGlobalLoading(): GlobalLoadingContextValue {
  const ctx = useContext(GlobalLoadingContext);
  if (!ctx) {
    throw new Error("useGlobalLoading must be used within a GlobalLoadingProvider");
  }
  return ctx;
}
