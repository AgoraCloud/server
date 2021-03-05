import { DeploymentsService } from './../deployments/deployments.service';
import { InvalidMongoIdException } from './../../exceptions/invalid-mongo-id.exception';
import { isMongoId } from 'class-validator';
import { HttpAdapterHost } from '@nestjs/core';
import { Request, Response } from 'express';
import {
  Inject,
  Injectable,
  OnModuleInit,
  InternalServerErrorException,
} from '@nestjs/common';
import * as HttpProxy from 'http-proxy';
import { Server } from 'http';
import { Socket } from 'net';
import { resourcePrefix } from '../kubernetes/helpers';

@Injectable()
export class ProxyService implements OnModuleInit {
  constructor(
    @Inject(HttpProxy) private readonly httpProxy: HttpProxy,
    private readonly httpAdapterHost: HttpAdapterHost,
    private readonly deploymentsService: DeploymentsService,
  ) {}

  onModuleInit(): void {
    this.onProxyError();
    this.proxyWebsockets();
  }

  /**
   * Handle proxy errors
   */
  private onProxyError(): void {
    this.httpProxy.on(
      'error',
      (err: Error, req: Request, res: Response, target: any) => {
        const exception: InternalServerErrorException = new InternalServerErrorException(
          `Error proxying ${target.host}`,
        );
        res.status(exception.getStatus()).json(exception.getResponse());
      },
    );
  }

  /**
   * Proxy all deployment websockets
   */
  private proxyWebsockets(): void {
    const httpServer: Server = this.httpAdapterHost.httpAdapter.getHttpServer();
    httpServer.on(
      'upgrade',
      async (req: Request, socket: Socket, head: any) => {
        const url: string[] = req.url.split('/');
        const workspaceId: string = url[2];
        const deploymentId: string = url[4];
        if (!isMongoId(workspaceId)) {
          throw new InvalidMongoIdException('workspaceId');
        }
        if (!isMongoId(deploymentId)) {
          throw new InvalidMongoIdException('deploymentId');
        }
        await this.deploymentsService.findOne(
          deploymentId,
          undefined,
          workspaceId,
        );
        req.url = this.removeProxyUrlPrefix(req.url, workspaceId, deploymentId);
        this.httpProxy.ws(
          req,
          socket,
          head,
          this.makeProxyOptions(workspaceId, deploymentId),
        );
      },
    );
  }

  /**
   * Proxy all deployment requests
   * @param workspaceId the workspace id
   * @param deploymentId the deployment id
   * @param req the request
   * @param res the response
   */
  proxy(
    workspaceId: string,
    deploymentId: string,
    req: Request,
    res: Response,
  ): void {
    req.url = this.removeProxyUrlPrefix(req.url, workspaceId, deploymentId);
    this.httpProxy.web(
      req,
      res,
      this.makeProxyOptions(workspaceId, deploymentId),
    );
  }

  /**
   * Dynamically creates configuration options for the proxy
   * @param workspaceId the deployments workspace id
   * @param deploymentId the deployment id
   */
  private makeProxyOptions(
    workspaceId: string,
    deploymentId: string,
  ): HttpProxy.ServerOptions {
    return {
      target: `http://${resourcePrefix}-${deploymentId}.${resourcePrefix}-${workspaceId}.svc.cluster.local`,
      changeOrigin: true,
    };
  }

  /**
   * Removes the proxy prefix from request urls
   * @param requestUrl the request url
   * @param workspaceId the workspace id
   * @param deploymentId the deployment id
   */
  private removeProxyUrlPrefix(
    requestUrl: string,
    workspaceId: string,
    deploymentId: string,
  ): string {
    return requestUrl.replace(
      `/workspaces/${workspaceId}/deployments/${deploymentId}/proxy`,
      '',
    );
  }
}
