import { Request, Response } from 'express';
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
   */
  proxy(deploymentId: string, req: Request, res: Response): void {
    const options: HttpProxy.ServerOptions = {
      target: `http://${this.resourcePrefix}-${deploymentId}.${this.resourcePrefix}.svc.cluster.local`,
    };
    const connection: string = req.headers['connection'];
    const upgrade: string = req.headers['upgrade'];
    if (connection === 'Upgrade' && upgrade === 'websocket') {
      this.httpProxy.ws(req, req.socket, req.app.head, options, (err) => {
        this.logger.error({ message: 'WS Proxy Error', err });
      });
    } else {
      this.httpProxy.web(req, res, options, (err) => {
        this.logger.error({ message: 'WEB Proxy Error', err });
      });
    }
  }
}
