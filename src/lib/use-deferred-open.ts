"use client";

import { useCallback, useState } from "react";

// Base UI's Dialog treats the trailing click of the button that opened it as an
// "outside press" and closes immediately. Deferring the state update to the next
// tick lets the opening click finish before the dialog mounts its listeners.
export function useDeferredOpen(initial = false) {
  const [open, setOpen] = useState(initial);
  const openDeferred = useCallback((fn?: () => void) => {
    fn?.();
    setTimeout(() => setOpen(true), 0);
  }, []);
  return { open, setOpen, openDeferred };
}
