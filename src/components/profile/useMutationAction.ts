"use client";

import { useRef, useState, useTransition } from "react";
import type { ActionResult } from "@/lib/action-result";

export function useMutationAction(action: (form: FormData) => Promise<ActionResult>, onSuccess?: () => void) {
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saved, setSaved] = useState(false);
  const locked = useRef(false);
  function submit(form: FormData) {
    if (locked.current) return;
    locked.current = true;
    setErrors({}); setSaved(false);
    startTransition(async () => {
      try {
        const result = await action(form);
        if (result.ok) { setSaved(true); onSuccess?.(); }
        else setErrors(result.errors);
      } catch { setErrors({ form: "Changes could not be saved. Check your connection and try again." }); }
      finally { locked.current = false; }
    });
  }
  return { submit, pending, errors, saved, clear: () => { setErrors({}); setSaved(false); } };
}
