import pino from 'pino';
import { appConfig } from '../config/env';

const logger = pino({
  level: appConfig.isDev ? 'debug' : 'info',
  transport: appConfig.isDev
    ? {
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:standard'
        }
      }
    : undefined,
  base: {
    env: appConfig.env
  }
});

export default logger;
