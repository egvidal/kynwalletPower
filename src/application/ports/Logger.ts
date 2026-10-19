/**
 * Evento estructurado (research.md R14). NUNCA debe incluir nombre, correo, contraseña ni
 * mensajes de error que puedan contener datos ingresados (Constitución 5.4).
 */
export type LogEntry = {
  event: string;
  attemptId: string;
  [field: string]: string | number | boolean | string[];
};

/** Puerto de registro de eventos (Constitución 5.5 y 8.7). */
export interface Logger {
  info(entry: LogEntry): void;
  error(entry: LogEntry): void;
}
