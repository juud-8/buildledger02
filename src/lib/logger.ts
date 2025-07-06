const LEVELS = { error: 0, warn: 1, info: 2, debug: 3 } as const;
type LogLevel = keyof typeof LEVELS;

const defaultLevel: LogLevel = process.env.NODE_ENV === 'production' ? 'info' : 'debug';
const envLevel = (process.env.NEXT_PUBLIC_LOG_LEVEL || process.env.LOG_LEVEL) as LogLevel | undefined;
const currentLevel: LogLevel = envLevel && LEVELS[envLevel] !== undefined ? envLevel : defaultLevel;

function shouldLog(level: LogLevel) {
  return LEVELS[level] <= LEVELS[currentLevel];
}

export const logger = {
  error: (...args: unknown[]) => shouldLog('error') && console.error(...args),
  warn: (...args: unknown[]) => shouldLog('warn') && console.warn(...args),
  info: (...args: unknown[]) => shouldLog('info') && console.info(...args),
  debug: (...args: unknown[]) => shouldLog('debug') && console.debug(...args)
};
export default logger;
