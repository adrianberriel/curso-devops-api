import { EventEmitter } from 'node:events';
import { Logger } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { LoggerMiddleware } from './logger.middleware.js';

describe('LoggerMiddleware', () => {
  let middleware: LoggerMiddleware;
  let next: NextFunction;

  const request = (method = 'GET', originalUrl = '/products') => ({ method, originalUrl }) as Request;

  // La response real es un EventEmitter: el middleware loguea recién en 'finish',
  // así que el doble tiene que poder emitir ese evento.
  const response = (statusCode: number) => {
    const res = new EventEmitter() as unknown as Response & EventEmitter;
    (res as { statusCode: number }).statusCode = statusCode;
    return res;
  };

  beforeEach(() => {
    middleware = new LoggerMiddleware();
    next = vi.fn();
  });

  it('should call next() to pass control along the chain', () => {
    middleware.use(request(), response(200), next);

    expect(next).toHaveBeenCalledOnce();
  });

  it('should not log until the response finishes', () => {
    const log = vi.spyOn(Logger.prototype, 'log').mockImplementation(() => {});

    middleware.use(request(), response(200), next);

    expect(log).not.toHaveBeenCalled();
  });

  describe('log level derived from the status code', () => {
    it.for([
      { statusCode: 200, level: 'log' },
      { statusCode: 201, level: 'log' },
      { statusCode: 302, level: 'log' },
      { statusCode: 400, level: 'warn' },
      { statusCode: 404, level: 'warn' },
      { statusCode: 500, level: 'error' },
      { statusCode: 503, level: 'error' },
    ] as const)('should log $statusCode as $level', ({ statusCode, level }) => {
      const spy = vi.spyOn(Logger.prototype, level).mockImplementation(() => {});
      const res = response(statusCode);

      middleware.use(request('GET', '/products/1'), res, next);
      res.emit('finish');

      expect(spy).toHaveBeenCalledWith(`GET /products/1 ${statusCode}`, {
        method: 'GET',
        path: '/products/1',
        status_code: statusCode,
      });
    });
  });
});
