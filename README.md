[![Visual Studio Marketplace](https://vsmarketplacebadge.apphb.com/version/redhat.vscode-knative.svg)](https://marketplace.visualstudio.com/items?itemName=redhat.vscode-knative)
![CI](https://github.com/talamer/vscode-knative/workflows/CI/badge.svg)
[![Unit Tests Code Coverage](https://codecov.io/gh/redhat-developer/vscode-knative/branch/main/graph/badge.svg)](https://codecov.io/gh/redhat-developer/vscode-knative/branch/main/graph/badge.svg)
[![License](https://img.shields.io/badge/license-MIT-brightgreen.svg)](https://github.com/redhat-developer/vscode-knative/blob/master/LICENSE)

# Knative & Serverless Functions for Visual Studio Code

[Knative](https://knative.tips/intro/knative/) (pronounced kay-native) is a set of open source components for Kubernetes that implements functionality to:

  * run stateless workloads such as micro-services
  * event subscription, delivery and handling

on Kubernetes clusters.

This extension for Knative provides the app developer the tools and experience needed when working with Knative & Serverless Functions on a Kubernetes cluster. Using this extension, developers can view and deploy their applications in a serverless way.
## Requirements

* YAML is validated using the [VSCode-YAML](https://marketplace.visualstudio.com/items?itemName=redhat.vscode-yaml)

* Login in to a Kubernetes cluster is done via the [Kubernetes extension](https://marketplace.visualstudio.com/items?itemName=ms-kubernetes-tools.vscode-kubernetes-tools) (ms-kubernetes-tools.vscode-kubernetes-tools).

  > NOTE: You will need to have the [kubeconfig](https://kubernetes.io/docs/concepts/configuration/organize-cluster-access-kubeconfig/#the-kubeconfig-environment-variable) for the cluster that you are accessing stored locally.

*  Knative uses [kn cli](https://github.com/knative/client) `1.3.1` and [func cli](https://github.com/knative-sandbox/kn-plugin-func) `0.23.1`. The extension will offer to download and install the dependencies if needed.

## Extension Settings

This extension contributes two views (Knative and Functions) and the following settings:

### Knative
* `service.explorer.create`: Create a new Knative service in the current namespace
* `service.explorer.openFile`: Display yaml for selected item
* `service.explorer.refresh`: Refresh the Explorer tree view
* `service.explorer.reportIssue`: Report Extension Issue on GitHub

### Functions

* `function.explorer.create`: Create a new Knative Function in the current namespace
* `function.explorer.refresh`: Refresh the Functions tree view

## Commands and features

`vscode-knative` supports a number of commands for interacting with Knative and Knative Functions; these are accessible via the tree context menu and/or via the command palette (`Cmd+Shift+P` <kbd>⌘⇧P</kbd> on macOS or `Ctrl+Shift+P` <kbd>⌃⇧P</kbd> on Windows and Linux)

### Knative

* `Knative: Add Service`: Start a workflow to create a new Service
* `Knative: Focus on Serving View`: Load and Open the Knative Serving view
* `Knative: Focus on Eventing View`: Load and Open the Knative Eventing view
* `Knative: Refresh View`: Refresh the Service/Eventing Tree View
* `Knative: Add a Tag`: Add a new tag to a Revision
* `Knative: Delete`: Delete a service or a revision or an eventing resource
* `Knative: Open in Browser`: Open the service in your browser

### Functions

* `Knative: Create Function`: Open up a wizard to create a new Function
* `Knative: Build Function`: Build an image from the selected function
* `Knative: Run`: Run the locally opened function in a local container. It can be executed after a build has been performed.
* `Knative: Deploy Function`: Build and Deploy a function to the cluster.
* `Knative: Undeploy`: Undeploy a function from the cluster
* `Knative: Add Config to Function`: Allow to customize a function by adding an environment variable or a volume
* `Knative: Remove Config from Function`: Allow to customize a function by removing an environment variable or a volume
* `Knative: Open in Browser`: Open the deployed function in your browser
* `Knative: Refresh View`: Refresh the Function Tree View
## Release Notes

> See [CHANGELOG](CHANGELOG.md) for details.

## Contributing

This is an open source project open to anyone. This project welcomes contributions and suggestions!

For information on getting started, refer to the [CONTRIBUTING instructions](CONTRIBUTING.md).

Download the most recent `knative-<version>.vsix` file from the [release](https://github.com/redhat-developer/vscode-knative/releases) and install it by following the instructions [here](https://code.visualstudio.com/docs/editor/extension-gallery#_install-from-a-vsix). Stable releases are archived [here](https://download.jboss.org/jbosstools/adapters/stable/vscode-knative/).

## Feedback & Questions

If you discover an issue please file a bug and we will fix it as soon as possible.
* File a bug in [GitHub Issues](https://github.com/redhat-developer/vscode-knative/issues).
* Open a [Discussion on GitHub](https://github.com/redhat-developer/vscode-knative/discussions).

## License

MIT, See [LICENSE](LICENSE) for more information.

## Data and telemetry

The Knative extension for Visual Studio Code collects anonymous [usage data](USAGE_DATA.md) and sends it to Red Hat servers to help improve our products and services. Read our [privacy statement](https://developers.redhat.com/article/tool-data-collection) to learn more. This extension respects the `redhat.telemetry.enabled` setting which you can learn more about at https://github.com/redhat-developer/vscode-commons#how-to-disable-telemetry-reporting


