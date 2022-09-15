/* eslint-disable camelcase */
/* eslint-disable no-use-before-define */
/* eslint-disable dot-notation */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-use-before-define */
/* eslint-disable @typescript-eslint/no-floating-promises */
/* eslint-disable import/no-cycle */
/*-----------------------------------------------------------------------------------------------
 *  Copyright (c) Red Hat, Inc. All rights reserved.
 *  Licensed under the MIT License. See LICENSE file in the project root for license information.
 *-----------------------------------------------------------------------------------------------*/

import * as vscode from 'vscode';
import * as k8s from 'vscode-kubernetes-tools-api';
import { ConfigurationV1_1 } from 'vscode-kubernetes-tools-api/js/configuration/v1_1';
import { checkOpenShiftCluster } from './check-cluster';
import { CmdCliConfig } from './cli/cli-config';
import { createCliCommand, executeCmdCli } from './cli/cmdCli';
import { knExecutor } from './cli/execute';
import { KubectlAPI } from './cli/kubectl-api';
import { knvfs, KN_RESOURCE_SCHEME } from './cli/virtualfs';
import { CommandContext, setCommandContext } from './commands';
import { openTreeItemInEditor } from './editor/knativeOpenTextDocument';
import { KnativeReadonlyProvider, KN_READONLY_SCHEME } from './editor/knativeReadonlyProvider';
import { eventingDataProvider } from './eventingTree/eventingDataProvider';
import { EventingExplorer } from './eventingTree/eventingExplorer';
import { EventingTreeItem } from './eventingTree/eventingTreeItem';
import { activeCommandExplorer } from './functions/active-task-view/activeExplorer';
import { focusOnOutputChannel } from './functions/active-task-view/focusOnOutputChannel';
import { stopCommand } from './functions/active-task-view/stop-command';
import { buildFunction, deployFunction } from './functions/function-command/build-and-deploy-function';
import {
  ConfigAction,
  configureEnvs,
  configureFunction,
  configureVolumes,
} from './functions/function-command/configure-function';
import { createFunctionPage } from './functions/function-command/create-function';
import { urlFunction } from './functions/function-command/get-url-function';
// eslint-disable-next-line import/no-cycle
import { createInvokeFunction } from './functions/function-command/invoke-function';
import { openInEditor } from './functions/function-command/open-yaml-file-in-editor';
import {
  addRepository,
  listRepository,
  removeRepository,
  renameRepository,
  repository,
} from './functions/function-command/repository-command';
import { runFunction } from './functions/function-command/run-function';
import { undeployFunction } from './functions/function-command/undeploy-function';
import { functionExplorer } from './functions/functionsExplorer';
import { Revision } from './knative/revision';
import { Service } from './knative/service';
import { servingDataProvider } from './servingTree/servingDataProvider';
import { ServingExplorer } from './servingTree/servingExplorer';
import { ServingTreeItem } from './servingTree/servingTreeItem';
import { startTelemetry, telemetryLog, telemetryLogError } from './telemetry';
import { functionVersion, knativeVersion } from './version';

let disposable: vscode.Disposable[];
// eslint-disable-next-line import/no-mutable-exports
export let contextGlobalState: vscode.ExtensionContext;

/**
 * This method is called when your extension is activated.
 * The extension is activated the very first time the command is executed.
 *
 * @param extensionContext
 */
export async function activate(extensionContext: vscode.ExtensionContext): Promise<void> {
  contextGlobalState = extensionContext;
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  startTelemetry(extensionContext);
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  setCommandContext(CommandContext.funcDisableRun, false);
  // Call the detect early here so that we avoid race conditions when the information is needed later.
  const knLocation: string = await CmdCliConfig.detectOrDownload('kn');
  const funcLocation: string = await CmdCliConfig.detectOrDownload('func');
  if (knLocation) {
    // eslint-disable-next-line no-use-before-define
    sendVersionToTelemetry('knative.kn.version', knLocation);
  }
  if (funcLocation) {
    // eslint-disable-next-line no-use-before-define
    sendVersionToTelemetry('knative.func.version', funcLocation);
    functionExplorer.refresh();
  }
  const servingExplorer = new ServingExplorer();
  // register a content provider for the knative readonly scheme
  const knReadonlyProvider = new KnativeReadonlyProvider(knvfs);

  const eventingExplorer = new EventingExplorer();

  // The command has been defined in the package.json file.
  // Now provide the implementation of the command with registerCommand.
  // The commandId parameter must match the command field in package.json.
  disposable = [
    vscode.commands.registerCommand('knative.version', () => knativeVersion()),
    vscode.commands.registerCommand('function.explorer.repository', () => repository()),
    vscode.commands.registerCommand('function.repository.add', () => addRepository()),
    vscode.commands.registerCommand('function.repository.list', () => listRepository()),
    vscode.commands.registerCommand('function.repository.rename', () => renameRepository()),
    vscode.commands.registerCommand('function.repository.remove', () => removeRepository()),
    vscode.commands.registerCommand('function.version', () => functionVersion()),
    vscode.commands.registerCommand('function.explorer.refresh', () => functionExplorer.refresh()),
    vscode.commands.registerCommand('function.explorer.create', () => createFunctionPage(extensionContext)),
    vscode.commands.registerCommand('function.invoke', (context) => createInvokeFunction(extensionContext, context)),
    vscode.commands.registerCommand('function.undeploy', (context) => undeployFunction(context)),
    vscode.commands.registerCommand('function.openInEditor', (context) => openInEditor(context)),
    vscode.commands.registerCommand('function.build', (context) => buildFunction(context)),
    vscode.commands.registerCommand('function.deploy', (context) => deployFunction(context)),
    vscode.commands.registerCommand('activeCommand.stop', (context) => stopCommand(context)),
    vscode.commands.registerCommand('activeCommand.focus', (context) => focusOnOutputChannel(context)),
    vscode.commands.registerCommand('function.OpenInBrowserAction', (context) => urlFunction(context)),
    vscode.commands.registerCommand('function.run', (context) => runFunction(context)),
    vscode.commands.registerCommand('function.addEnv', (context) => configureEnvs(ConfigAction.Add, context)),
    vscode.commands.registerCommand('function.addVolume', (context) => configureVolumes(ConfigAction.Add, context)),
    vscode.commands.registerCommand('function.addConfig.Palette', () => configureFunction(ConfigAction.Add)),
    vscode.commands.registerCommand('function.removeEnv', (context) => configureEnvs(ConfigAction.Remove, context)),
    vscode.commands.registerCommand('function.removeVolume', (context) => configureVolumes(ConfigAction.Remove, context)),
    vscode.commands.registerCommand('function.removeConfig.Palette', () => configureFunction(ConfigAction.Remove)),
    vscode.commands.registerCommand('knative.service.open-in-browser', async (treeItem: ServingTreeItem) => {
      const item = treeItem.getKnativeItem();
      if (item instanceof Service) {
        await vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(item.image));
      }
      if (item instanceof Revision) {
        if (item.traffic) {
          // Find the first tagged traffic & open the URL. There can be more than one tagged traffics
          // however for our purposes opening the first one should be enough.
          const taggedTraffic = item.traffic.find((val) => val.tag);
          if (taggedTraffic) {
            await vscode.commands.executeCommand('vscode.open', vscode.Uri.parse(taggedTraffic.url.toString()));
          }
        }
      }
    }),
    vscode.workspace.registerTextDocumentContentProvider(KN_READONLY_SCHEME, knReadonlyProvider),
    vscode.commands.registerCommand('eventing.explorer.openFile', (treeItem: EventingTreeItem) =>
      openTreeItemInEditor(treeItem, vscode.workspace.getConfiguration('vs-knative')['vs-knative.outputFormat'], false),
    ),

    vscode.commands.registerCommand('service.explorer.openFile', (treeItem: ServingTreeItem) =>
      openTreeItemInEditor(treeItem, vscode.workspace.getConfiguration('vs-knative')['vs-knative.outputFormat'], false),
    ),

    vscode.commands.registerCommand('service.explorer.edit', (treeItem: ServingTreeItem) =>
      openTreeItemInEditor(treeItem, vscode.workspace.getConfiguration('vs-knative')['vs-knative.outputFormat'], true),
    ),

    // Temporarily loaded resource providers
    vscode.workspace.registerFileSystemProvider(KN_RESOURCE_SCHEME, knvfs, {
      isCaseSensitive: true,
    }),
    vscode.workspace.registerFileSystemProvider(KN_READONLY_SCHEME, knvfs, {
      isCaseSensitive: true,
      isReadonly: true,
    }),

    servingExplorer,
    eventingExplorer,
    functionExplorer,
    activeCommandExplorer,
  ];
  // eslint-disable-next-line no-use-before-define
  await checkClusterVersion();
  const configurationApi = await k8s.extension.configuration.v1_1;
  if (configurationApi.available) {
    const confApi = configurationApi.api;
    setKubeConfigPath(confApi);
    confApi.onDidChangeContext(async () => {
      // eslint-disable-next-line no-use-before-define
      await checkClusterVersion();
      setKubeConfigPath(confApi);
    });
    confApi.onDidChangeNamespace(() => {
      setKubeConfigPath(confApi);
    });
    confApi.onDidChangeKubeconfigPath(() => {
      setKubeConfigPath(confApi);
    });
  }

  // extensionContext.subscriptions.push(disposable);
  disposable.forEach((value) => extensionContext.subscriptions.push(value));
}

function setKubeConfigPath(confApi: ConfigurationV1_1): void {
  const configPath = confApi.getKubeconfigPath();
  if (configPath?.['hostPath']) {
    process.env.KUBECONFIG = confApi.getKubeconfigPath()?.['hostPath'];
    functionExplorer.refresh();
    servingDataProvider.refresh();
    eventingDataProvider.refresh();
  }
  if (configPath?.['wslPath']) {
    process.env.KUBECONFIG = confApi.getKubeconfigPath()?.['wslPath'];
    functionExplorer.refresh();
    servingDataProvider.refresh();
    eventingDataProvider.refresh();
  }
}

async function checkClusterVersion(): Promise<void> {
  const ocpCluster = await checkOpenShiftCluster();
  if (ocpCluster) {
    telemetryLog('openshift_version', ocpCluster.items[0].status.desired.version);
  } else {
    const result = await knExecutor.execute(KubectlAPI.printVersion(), process.cwd(), false);
    if (result?.stdout?.trim()) {
      telemetryLog(
        'kubernetes_version',
        // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
        `kubernetes version: ${JSON.parse(result?.stdout).serverVersion?.gitVersion}`,
      );
    }
  }
}

async function sendVersionToTelemetry(commandId: string, cmd: string): Promise<void> {
  const result = await executeCmdCli.execute(createCliCommand(cmd, 'version'));
  if (result.error) {
    telemetryLogError(commandId, result.error);
  }
  if (commandId === 'knative.kn.version' && result.stdout) {
    telemetryLog(commandId, result.stdout);
  } else if (result.stdout && commandId === 'knative.func.version') {
    telemetryLog(commandId, `Function Version: ${result.stdout}`);
  }
}

// this method is called when your extension is deactivated
export function deactivate(): void {
  disposable.forEach((command) => {
    command.dispose();
  });
}
