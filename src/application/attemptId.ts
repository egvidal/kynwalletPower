/**
 * Identificador de un intento para trazar sus eventos (research.md R14). `crypto.randomUUID`
 * solo existe en contextos seguros (HTTPS o localhost); fuera de ellos se usa un respaldo
 * suficiente para correlacionar eventos, no para fines criptográficos.
 */
export function newAttemptId(): string {
  if (typeof globalThis.crypto?.randomUUID === 'function') return globalThis.crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
