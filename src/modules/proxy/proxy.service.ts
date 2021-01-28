import { ExpressAdapter } from '@nestjs/platform-express';
import { HttpAdapterHost } from '@nestjs/core';
import { KubernetesClientService } from './../kubernetes-client/kubernetes-client.service';
import { Request, Response, Express } from 'express';
import { Inject, Injectable, Logger, OnModuleInit } from '@nestjs/common';
import * as HttpProxy from 'http-proxy';
import { V1Pod } from '@kubernetes/client-node';
import * as request from 'request';
import { Server } from 'http';
import { Socket } from 'net';
import * as url from 'url';

@Injectable()
export class ProxyService implements OnModuleInit {
  private readonly logger: Logger = new Logger(ProxyService.name);

  constructor(
    @Inject(HttpProxy) private readonly httpProxy: HttpProxy,
    private readonly kubernetesClientService: KubernetesClientService,
    private readonly adapterHost: HttpAdapterHost,
  ) {}

  onModuleInit() {
    const httpServer: Server = this.adapterHost.httpAdapter.getHttpServer();
    const express: Express = this.adapterHost.httpAdapter.getInstance();
    express.all('/proxy/:deploymentId/*', async (req, res) => {
      const deploymentId: string = req.params.deploymentId;
      req.url = req.url.replace(`/proxy/${deploymentId}`, '');
      // const podIp: string = await this.getDeploymentPodIpAddress(deploymentId);
      const options: HttpProxy.ServerOptions = {
        target: `http://agoracloud-${deploymentId}:8443`,
      };
      this.httpProxy.web(req, res, options);
    });

    httpServer.on('upgrade', async (req: Request, socket: Socket, head) => {
      const deploymentId: string = req.url.split('/')[2];
      req.url = req.url.replace(`/proxy/${deploymentId}`, '');
      req.query = url.parse(req.url, true).query;
      // const podIp: string = await this.getDeploymentPodIpAddress(deploymentId);
      const options: HttpProxy.ServerOptions = {
        target: `http://agoracloud-${deploymentId}:8443`,
      };
      this.httpProxy.ws(req, socket, head, options);

      // const kubeUrl: URL = new URL(
      //   this.kubernetesClientService.kc.getCurrentCluster().server,
      // );
      // const opts: request.Options = { url: '' };
      // await this.kubernetesClientService.kc.applyToRequest(opts);

      // const options: HttpProxy.ServerOptions = {
      //   target: {
      //     host: kubeUrl.hostname,
      //     protocol: kubeUrl.protocol,
      //     port: kubeUrl.port,
      //     path: `/api/v1/namespaces/agoracloud/services/agoracloud-${deploymentId}:80/proxy/`,
      //     key: opts.key.toString(),
      //     cert: opts.cert.toString(),
      //     ca: opts.ca.toString(),
      //   },
      // };
    });
  }

  /**
   * Proxy all deployment requests
   * @param deploymentId the deployment id
   * @param req the request
   * @param res the response
   */
  async proxy(
    deploymentId: string,
    req: Request,
    res: Response,
  ): Promise<void> {
    // const podIp: string = await this.getDeploymentPodIpAddress(deploymentId);
    // const options: HttpProxy.ServerOptions = {
    //   target: `http://${podIp}:8443`,
    //   toProxy: true,
    //   secure: false,
    //   timeout: 120000,
    // };
    // const connection: string = req.headers['connection'];
    // const upgrade: string = req.headers['upgrade'];
    // if (connection === 'Upgrade' && upgrade === 'websocket') {
    //   this.httpProxy.ws(req, req.socket, req.app.head, options);
    // } else {
    //   this.httpProxy.web(req, res, options);
    // }

    const kubeUrl: url.URL = new url.URL(
      this.kubernetesClientService.kc.getCurrentCluster().server,
    );
    const opts: request.Options = { url: '' };
    await this.kubernetesClientService.kc.applyToRequest(opts);

    const options: HttpProxy.ServerOptions = {
      target: {
        host: kubeUrl.hostname,
        protocol: kubeUrl.protocol,
        port: kubeUrl.port,
        path: `/api/v1/namespaces/agoracloud/services/agoracloud-${deploymentId}:80/proxy/`,
        key: opts.key.toString(),
        cert: opts.cert.toString(),
        ca: opts.ca.toString(),
      },
    };
    this.httpProxy.web(req, res, options);
  }

  /**
   * Gets the deployment pod IP address
   * @param deploymentId the deployment id
   */
  private async getDeploymentPodIpAddress(
    deploymentId: string,
  ): Promise<string> {
    const pod: V1Pod = await this.kubernetesClientService.getPod(deploymentId);
    return pod.status?.podIP;
  }
}
