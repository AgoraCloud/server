import { Request, Response, NextFunction } from 'express';
import { Inject, Injectable, Logger } from '@nestjs/common';
import * as HttpProxy from 'http-proxy';

@Injectable()
export class ProxyService {
  private readonly resourcePrefix: string = 'agoracloud';
  private readonly logger: Logger = new Logger(ProxyService.name);

  constructor(@Inject(HttpProxy) private readonly httpProxy: HttpProxy) {}

  /**
   * Proxy all deployment requests
   * @param deploymentId the deployment id
   * @param req the request
   * @param res the response
   * @param next the next function
   */
  proxy(
    deploymentId: string,
    req: Request,
    res: Response,
    next: NextFunction,
  ): void {
    this.logger.debug({
      protocol: req.protocol,
      host: req.hostname,
      url: req.url,
      path: req.path,
      headers: req.headers,
      cookies: req.cookies,
      deploymentId: deploymentId || 'No ID',
    });

    const baseUrl = `${this.resourcePrefix}-${deploymentId}:80`;
    // this.httpProxy.web(
    //   req,
    //   res,
    //   { target: `http://${baseUrl}`, changeOrigin: true, ws: true },
    //   next,
    // );
    const connection: string = req.headers['connection'];
    const upgrade: string = req.headers['upgrade'];
    if (connection === 'Upgrade' && upgrade === 'websocket') {
      this.httpProxy.ws(req, req.socket, req.app.head, {
        target: `ws://${baseUrl}`,
        changeOrigin: true,
        ws: true,
      });
    } else {
      this.httpProxy.web(
        req,
        res,
        { target: `http://${baseUrl}`, changeOrigin: true },
        next,
      );
    }
  }
}
