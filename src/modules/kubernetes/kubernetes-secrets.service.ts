import { KubeUtil } from './utils/kube.util';
import { Inject, Injectable } from '@nestjs/common';
import * as k8s from '@kubernetes/client-node';
import * as http from 'http';

@Injectable()
export class KubernetesSecretsService {
  constructor(
    @Inject(k8s.CoreV1Api) private readonly k8sCoreV1Api: k8s.CoreV1Api,
  ) {}

  /**
   * Get all Kubernetes secrets
   * @param namespace the Kubernetes namespace
   * @returns a list of all Kubernetes secrets
   */
  getAllSecrets(namespace: string): Promise<{
    response: http.IncomingMessage;
    body: k8s.V1SecretList;
  }> {
    return this.k8sCoreV1Api.listNamespacedSecret(
      namespace,
      undefined,
      undefined,
      undefined,
      undefined,
      'deployment',
    );
  }

  /**
   * Create a Kubernetes secret
   * @param namespace the Kubernetes namespace
   * @param deploymentId the deployment id
   * @param sudoPassword the deployment container sudo password
   * @returns the created Kubernetes secret
   */
  createSecret(
    namespace: string,
    deploymentId: string,
    sudoPassword: string,
  ): Promise<{
    response: http.IncomingMessage;
    body: k8s.V1Secret;
  }> {
    return this.k8sCoreV1Api.createNamespacedSecret(namespace, {
      apiVersion: 'v1',
      kind: 'Secret',
      metadata: {
        name: KubeUtil.generateResourceName(deploymentId),
        labels: KubeUtil.generateDeploymentLabels(deploymentId),
      },
      data: {
        sudo_password: KubeUtil.toBase64(sudoPassword),
      },
    });
  }

  /**
   * Delete a Kubernetes secret
   * @param namespace the Kubernetes namespace
   * @param deploymentId the deployment id
   * @returns the deleted Kubernetes secret
   */
  deleteSecret(
    namespace: string,
    deploymentId: string,
  ): Promise<{
    response: http.IncomingMessage;
    body: k8s.V1Status;
  }> {
    return this.k8sCoreV1Api.deleteNamespacedSecret(
      KubeUtil.generateResourceName(deploymentId),
      namespace,
    );
  }
}
