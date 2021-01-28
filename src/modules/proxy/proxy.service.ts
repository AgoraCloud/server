import { KubernetesClientService } from './../kubernetes-client/kubernetes-client.service';
import { Request, Response } from 'express';
import { Inject, Injectable } from '@nestjs/common';
import * as HttpProxy from 'http-proxy';
import { V1Pod } from '@kubernetes/client-node';

@Injectable()
export class ProxyService {
  constructor(
    @Inject(HttpProxy) private readonly httpProxy: HttpProxy,
    private readonly kubernetesClientService: KubernetesClientService,
  ) {}

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
    const podIp: string = await this.getDeploymentPodIpAddress(deploymentId);
    const options: HttpProxy.ServerOptions = {
      target: `http://${podIp}`,
    };
    const connection: string = req.headers['connection'];
    const upgrade: string = req.headers['upgrade'];
    if (connection === 'Upgrade' && upgrade === 'websocket') {
      this.httpProxy.ws(req, req.socket, req.app.head, options);
    } else {
      this.httpProxy.web(req, res, options);
    }
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
