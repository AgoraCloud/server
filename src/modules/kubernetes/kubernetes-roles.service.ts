import { KubeUtil } from './utils/kube.util';
import { KubernetesConfig } from '../../config/configuration.interface';
import { Inject, Injectable } from '@nestjs/common';
import * as k8s from '@kubernetes/client-node';
import * as http from 'http';

@Injectable()
export class KubernetesRolesService {
  constructor(
    @Inject(k8s.RbacAuthorizationV1Api)
    private readonly k8sRbacAuthorizationV1Api: k8s.RbacAuthorizationV1Api,
    @Inject('KUBERNETES_CONFIG')
    private readonly kubernetesConfig: KubernetesConfig,
  ) {}

  /**
   * Create a Kubernetes role
   * @param namespace the Kubernetes namespace
   * @param workspaceId the workspace id
   * @returns the created Kubernetes role
   */
  createRole(
    namespace: string,
    workspaceId: string,
  ): Promise<{
    response: http.IncomingMessage;
    body: k8s.V1Role;
  }> {
    return this.k8sRbacAuthorizationV1Api.createNamespacedRole(namespace, {
      apiVersion: 'rbac.authorization.k8s.io/v1',
      kind: 'Role',
      metadata: {
        name: KubeUtil.generateResourceName(workspaceId),
        labels: KubeUtil.generateWorkspaceLabels(workspaceId),
      },
      rules: [
        {
          apiGroups: [''],
          resources: [
            'pods',
            'pods/log',
            'services',
            'secrets',
            'persistentvolumeclaims',
          ],
          verbs: ['*'],
        },
        {
          apiGroups: ['apps'],
          resources: ['deployments'],
          verbs: ['*'],
        },
        {
          apiGroups: ['metrics.k8s.io'],
          resources: ['pods'],
          verbs: ['get', 'list'],
        },
      ],
    });
  }

  /**
   * Create a Kubernetes role binding
   * @param namespace the Kubernetes namespace
   * @param workspaceId the workspace id
   * @returns the created Kubernetes role binding
   */
  createRoleBinding(
    namespace: string,
    workspaceId: string,
  ): Promise<{
    response: http.IncomingMessage;
    body: k8s.V1RoleBinding;
  }> {
    const name: string = KubeUtil.generateResourceName(workspaceId);
    return this.k8sRbacAuthorizationV1Api.createNamespacedRoleBinding(
      namespace,
      {
        apiVersion: 'rbac.authorization.k8s.io/v1',
        kind: 'RoleBinding',
        metadata: {
          name,
          labels: KubeUtil.generateWorkspaceLabels(workspaceId),
        },
        roleRef: {
          apiGroup: 'rbac.authorization.k8s.io',
          kind: 'Role',
          name,
        },
        subjects: [
          {
            kind: 'ServiceAccount',
            name: this.kubernetesConfig.serviceAccount,
            namespace: this.kubernetesConfig.namespace,
          },
        ],
      },
    );
  }
}
