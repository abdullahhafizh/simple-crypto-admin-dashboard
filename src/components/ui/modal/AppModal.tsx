import type { MouseEvent, ReactNode } from "react";
import { useEffect } from "react";

type AppModalProps = {
  open: boolean;
  onClose: () => void;
  featureLabel?: string;
  title?: string;
  description?: string;
  footer?: ReactNode;
  closeOnEsc?: boolean;
  closeOnBackdrop?: boolean;
};

export default function AppModal({
  open,
  onClose,
  featureLabel,
  title = "Coming soon",
  description,
  footer,
  closeOnEsc = true,
  closeOnBackdrop = true,
}: AppModalProps) {
  const label = featureLabel ?? "This feature";

  const handleBackdropMouseDown = (
    event: MouseEvent<HTMLDivElement>,
  ): void => {
    if (!closeOnBackdrop) return;
    if (event.target === event.currentTarget) {
      onClose();
    }
  };

  useEffect(() => {
    if (!open || !closeOnEsc) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, closeOnEsc, onClose]);

  return (
    <div
      className={`fixed inset-0 z-[999999] flex items-center justify-center bg-black/40 transition-opacity duration-300 ease-out ${
        open ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      }`}
      onMouseDown={handleBackdropMouseDown}
    >
      <div
        className={`w-full max-w-md px-6 py-5 bg-white rounded-2xl shadow-lg dark:bg-gray-900 transform transition-all duration-300 ease-out ${
          open ? "opacity-100 scale-100" : "opacity-0 scale-95"
        }`}
      >
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
          {title}
        </h2>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          {description ?? `${label} is not available yet. Please check back soon.`}
        </p>
        <div className="flex justify-end mt-6 gap-2">
          {footer ?? (
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white transition rounded-lg bg-brand-500 shadow-theme-xs hover:bg-brand-600"
            >
              OK
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
