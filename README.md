[![Visual Studio Marketplace](https://img.shields.io/visual-studio-marketplace/v/redhat.vscode-knative?style=for-the-badge&label=VS%20Marketplace&logo=visual-studio-code)](https://marketplace.visualstudio.com/items?itemName=redhat.vscode-knative)
[![Build Status](https://img.shields.io/github/workflow/status/redhat-developer/vscode-knative/CI?logo=github&style=for-the-badge)](https://github.com/redhat-developer/vscode-knative/actions?query=workflow%3ACI)
[![Unit Tests Code Coverage](https://img.shields.io/codecov/c/github/redhat-developer/vscode-knative?logo=codecov&style=for-the-badge)](https://codecov.io/gh/redhat-developer/vscode-knative/branch/main/graph/badge.svg)
[![License](https://img.shields.io/badge/license-MIT-brightgreen.svg?style=for-the-badge)](https://github.com/redhat-developer/vscode-knative/blob/main/LICENSE)

# Knative & Serverless Functions for Visual Studio Code

[Knative](https://knative.dev/docs/) is an Open-Source Enterprise-level solution to build Serverless and Event Driven Applications. Serverless Containers in Kubernetes environments.

This extension for Knative provides the app developer the tools and experience needed when working with `Knative & Serverless Functions` on a Kubernetes cluster. Using this extension, developers can develop and deploy functions in a serverless way through guided IDE workflow.

## Requirements

* YAML is validated using the [VSCode-YAML](https://marketplace.visualstudio.com/items?itemName=redhat.vscode-yaml)
* Users can log in to Kubernetes cluster using [VSCode Kubernetes extension](https://marketplace.visualstudio.com/items?itemName=ms-kubernetes-tools.vscode-kubernetes-tools).

  > NOTE: You will need to have the [kubeconfig](https://kubernetes.io/docs/concepts/configuration/organize-cluster-access-kubeconfig/#the-kubeconfig-environment-variable) for the cluster that you are accessing stored locally.

* Knative uses [kn cli](https://github.com/knative/client) `1.7.0` and [func cli](https://github.com/knative/func) `1.7.0`. The extension will offer to download and install the dependencies if needed.

## Extension Settings

This extension contributes two views (Knative and Functions) and the following settings:

### Knative

* `service.explorer.create`: Create a new Knative service in the current namespace
* `service.explorer.openFile`: Display yaml for selected item
* `service.explorer.refresh`: Refresh the Explorer tree view

### Functions

* `function.explorer.reportIssue`: Report Extension Issue on GitHub
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

## Documentation

- [What is OpenShift Serverless](https://www.redhat.com/en/technologies/cloud-computing/openshift/serverless)
- [Setting up OpenShift Serverless Functions - Red Hat Official Documentation](https://docs.openshift.com/container-platform/4.11/serverless/functions/serverless-functions-setup.html)
- [Serverless Function CLI docs](https://github.com/knative/func)
- [Knative Docs](https://knative.dev/docs/)

## Release Notes

> See [CHANGELOG](CHANGELOG.md) for details.

## Contributing

This is an open source project open to anyone. We are always looking for contributions from the Function Developer community.

For information on getting started, refer to the [CONTRIBUTING instructions](CONTRIBUTING.md).

Download the most recent `knative-<version>.vsix` file from the [release](https://github.com/redhat-developer/vscode-knative/releases) and install it by following the instructions [here](https://code.visualstudio.com/docs/editor/extension-gallery#_install-from-a-vsix). Stable releases are archived [here](https://download.jboss.org/jbosstools/adapters/stable/vscode-knative/).

## Feedback & Questions

If you discover an issue please file a bug and we will fix it as soon as possible.

* File a bug in [GitHub Issues](https://github.com/redhat-developer/vscode-knative/issues).
* Open a [Discussion on GitHub](https://github.com/redhat-developer/vscode-knative/discussions).

The func Task Force meets @ 10:30 PST every Tuesday, we'd love to have you! For more information, see the invitation on the [Knative Team Calendar](https://calendar.google.com/calendar/u/0/embed?src=knative.team_9q83bg07qs5b9rrslp5jor4l6s@group.calendar.google.com).

## License

MIT, See [LICENSE](LICENSE) for more information.

## Data and telemetry

The Knative extension for Visual Studio Code collects anonymous [usage data](USAGE_DATA.md) and sends it to Red Hat servers to help improve our products and services. Read our [privacy statement](https://developers.redhat.com/article/tool-data-collection) to learn more. This extension respects the `redhat.telemetry.enabled` setting which you can learn more about at https://github.com/redhat-developer/vscode-commons#how-to-disable-telemetry-reporting


