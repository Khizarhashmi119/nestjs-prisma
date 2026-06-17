import type { Params } from 'nestjs-pino';

export const loggerConfig: Params = {
  pinoHttp: {
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    transport:
      process.env.NODE_ENV !== 'production'
        ? {
            target: 'pino-pretty',
            options: {
              singleLine: true,
              colorize: true,
              translateTime: 'HH:MM:ss',
              ignore: 'pid,hostname',
            },
          }
        : undefined,

    redact: {
      paths: [
        'req.headers.authorization',
        'req.headers.cookie',
        'req.body.password',
        'req.body.token',
      ],
      censor: '[REDACTED]',
    },

    genReqId: (req) => {
      return req.headers['x-request-id']?.toString() ?? crypto.randomUUID();
    },

    customProps: (req) => ({
      context: 'HTTP',
      requestId: req.id,
    }),

    customSuccessMessage: (req) => {
      return `${req.method} ${req.url} completed`;
    },

    customErrorMessage: (req) => {
      return `${req.method} ${req.url} failed`;
    },

    customReceivedMessage: (req) => {
      return `${req.method} ${req.url} incoming`;
    },
  },
};
