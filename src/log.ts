const LOG_LEVELS = ["trace", "debug", "info", "warn", "error"] as const;
export type LogLevel = typeof LOG_LEVELS[number];
const labelLength = Math.max(...LOG_LEVELS.map((l) => l.length));

function log(
  level: LogLevel,
  color: string,
  message: string,
  ...extraStyles: string[]
) {
  const pad = " ".repeat(labelLength - level.length);
  console.log(
    `%c[${level}${pad}]%c ${message}`,
    `background-color: ${color}`,
    `background-color: inherit; color: ${color}`,
    ...extraStyles,
  );
}

export const trace = (message: string, ...styles: string[]) =>
  log("trace", "gray", message, ...styles);
export const debug = (message: string, ...styles: string[]) =>
  log("debug", "magenta", message, ...styles);
export const info = (message: string, ...styles: string[]) =>
  log("info", "cyan", message, ...styles);
export const warn = (message: string, ...styles: string[]) =>
  log("warn", "yellow", message, ...styles);
export const error = (message: string, ...styles: string[]) =>
  log("error", "red", message, ...styles);
