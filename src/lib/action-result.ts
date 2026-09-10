export type ActionResult = { ok: true } | { ok: false; errors: Record<string, string> };

export class ValidationError extends Error {
  constructor(message: string, public field = "form") { super(message); }
}

export function runMutation(mutate: () => void): ActionResult {
  try { mutate(); return { ok: true }; }
  catch (error) {
    if (error instanceof ValidationError) return { ok: false, errors: { [error.field]: error.message } };
    throw error;
  }
}
