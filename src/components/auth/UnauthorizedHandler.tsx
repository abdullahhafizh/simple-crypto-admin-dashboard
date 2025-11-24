import { useEffect, useState } from "react";
import AppModal from "../ui/modal/AppModal";
import { useAuth } from "../../context/AuthContext";
import { registerUnauthorizedHandler } from "../../lib/httpClient";

export default function UnauthorizedHandler() {
  const { logout, token } = useAuth();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    registerUnauthorizedHandler(() => {
      if (!token) return;
      setOpen(true);
    });
  }, [token]);

  const handleClose = () => {
    setOpen(false);
  };

  const handleConfirm = () => {
    logout();
    setOpen(false);
  };

  return (
    <AppModal
      open={open}
      onClose={handleClose}
      closeOnEsc={false}
      closeOnBackdrop={false}
      title="Session expired"
      description="Your session has expired or is no longer valid. Please sign in again."
      footer={
        <button
          type="button"
          onClick={handleConfirm}
          className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium text-white transition rounded-lg bg-error-500 shadow-theme-xs hover:bg-error-600"
        >
          Sign out
        </button>
      }
    />
  );
}
