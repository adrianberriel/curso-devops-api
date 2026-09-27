import { Injectable, Logger, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  private readonly logger = new Logger('HTTP');

  use(req: Request, res: Response, next: NextFunction) {
    const { method, originalUrl: path } = req;

    res.on('finish', () => {
      const { statusCode: status_code } = res;
      const message = `${method} ${path} ${status_code}`;
      const params = { method, path, status_code };

      // El nivel se deriva del status para poder filtrar fallos por `level` en el
      // agregador de logs, sin tener que armar rangos numéricos sobre status_code.
      if (status_code >= 500) {
        this.logger.error(message, params);
      } else if (status_code >= 400) {
        this.logger.warn(message, params);
      } else {
        this.logger.log(message, params);
      }
    });

    next();
  }
}
