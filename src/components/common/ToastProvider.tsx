import { createContext, useCallback, useContext, useState, type ReactNode } from "react";

type ToastVariant = "info" | "success" | "error";

interface Toast {
  id: number;
  message: string;
  variant: ToastVariant;
}

interface ToastContextValue {
  showToast: (message: string, variant?: ToastVariant) => void;
}

const ToastContext = createContext<ToastContextValue | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((message: string, variant: ToastVariant = "info") => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, message, variant }]);

    window.setTimeout(() => {
      setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, 4000);
  }, []);

  const handleDismiss = (id: number) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-4 z-[9999] flex flex-col items-center gap-2 px-4">
        {toasts.map((toast) => {
          const baseClasses =
            "pointer-events-auto w-full max-w-md rounded-lg px-4 py-3 text-sm shadow-theme-xs border flex items-start justify-between gap-3";

          const variantClasses =
            toast.variant === "error"
              ? "bg-error-50 border-error-200 text-error-800 dark:bg-error-950/80 dark:border-error-900 dark:text-error-200"
              : toast.variant === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/80 dark:border-emerald-900 dark:text-emerald-200"
              : "bg-gray-900 text-gray-100 border-gray-700";

          return (
            <div key={toast.id} className={`${baseClasses} ${variantClasses}`}>
              <div className="flex-1 break-words">{toast.message}</div>
              <button
                type="button"
                onClick={() => handleDismiss(toast.id)}
                className="ml-3 text-xs font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                Close
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return ctx;
}
