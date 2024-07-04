export function assert(
  value: unknown,
  message: string = "Assertion failed",
): asserts value {
  if (!value) {
    throw new Error(message);
  }
}

export function prompt(message: string, defaultValue?: string): string {
  const response = globalThis.prompt(message, defaultValue);
  assert(typeof response === "string", "Not interactive");
  return response;
}
