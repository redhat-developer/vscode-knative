[![Visual Studio Marketplace](https://img.shields.io/visual-studio-marketplace/v/redhat.vscode-knative?style=for-the-badge&label=VS%20Marketplace&logo=visual-studio-code)](https://marketplace.visualstudio.com/items?itemName=redhat.vscode-knative)
[![License](https://img.shields.io/badge/license-MIT-brightgreen.svg?style=for-the-badge)](https://github.com/redhat-developer/vscode-knative/blob/main/LICENSE)

> [!IMPORTANT]  
> Developers are highly recommended to use the [OpenShift Toolkit](https://github.com/redhat-developer/vscode-openshift-tools) extension for `Knative Serverless Function` workflow to streamline their development process and ensure a seamless experience. All the latest features of Knative Serverless will be maintained in the OpenShift Toolkit extension, supported by Red Hat.

# Knative & Serverless Functions for Visual Studio Code

[Knative](https://knative.dev/docs/) is an Open-Source Enterprise-level solution to build Serverless and Event-Driven Applications. Thus running Serverless Containers in Kubernetes environments.

This extension for Knative provides the app developer with the tools and experience needed when working with `Knative & Serverless Functions` on a Kubernetes cluster. Using this extension, developers can develop and deploy functions in a serverless way through guided IDE workflow.

## Requirements

*  Knative extension uses [kn cli](https://github.com/knative/client) `1.13.0` and [func cli](https://github.com/knative/func) `1.13.0`. The extension will offer to download and install the dependencies if needed.

* YAML is validated using the [VSCode-YAML](https://marketplace.visualstudio.com/items?itemName=redhat.vscode-yaml) extension

* Users can log in to the Kubernetes cluster using [VSCode Kubernetes extension](https://marketplace.visualstudio.com/items?itemName=ms-kubernetes-tools.vscode-kubernetes-tools).

  > NOTE: You will need to have the [kubeconfig](https://kubernetes.io/docs/concepts/configuration/organize-cluster-access-kubeconfig/#the-kubeconfig-environment-variable) for the cluster that you are accessing stored locally.

## Extension Settings

This extension contributes two views (Knative and Functions) and the following settings:

### Functions

* `function.explorer.create`: Create a new Knative Function in the current namespace
* `function.explorer.refresh`: Refresh the Functions tree view
* `function.explorer.repository`: Manage installed template repositories. Once added, a template from the repository can be used when creating a new function.

### Function Sessions

* This view is used to showcase Active commands for a specified function. This includes Build, Deploy, and Run sessions. Once the command is executed for a given function, the node is displayed in the Sessions View. Users can also `Stop` the executing action. The logs can be seen in the `Output Channel`.

### Knative

* `service.explorer.create`: Create a new Knative service in the current namespace
* `service.explorer.openFile`: Display YAML for the selected item
* `service.explorer.refresh`: Refresh the Explorer tree view

## Commands and features

`vscode-knative` supports several commands for interacting with Knative and Knative Functions; these are accessible via the tree context menu and via the command palette (`Cmd+Shift+P` <kbd>⌘⇧P</kbd> on macOS or `Ctrl+Shift+P` <kbd>⌃⇧P</kbd> on Windows and Linux)

### Functions

* `Knative: Create Function`: Open up a wizard to create a new Function project
* `Knative: Build Function`: Build the function project as a container image
* `Knative: Run`: Runs the function locally in the current directory or in the directory specified
* `Knative: Deploy Function`: Deploys a function to the currently configured Knative-enabled cluster.
* `Knative: Undeploy`: Undeploys a function from the cluster.
* `Knative: Add Config to Function`: Allows configuration of Volume mounts and environment variables for a function project
* `Knative: Remove Config from Function`: Remove Volume mounts, Environment variable from the function configuration
* `Knative: Open in Browser`: Open the deployed function in your browser
* `Knative: Refresh View`: Refresh the Function Tree View

### Knative (Serving & Eventing)

* `Knative: Add Service`: Start a workflow to create a new Service
* `Knative: Focus on Serving View`: Load and Open the Knative Serving view
* `Knative: Focus on Eventing View`: Load and Open the Knative Eventing view
* `Knative: Refresh View`: Refresh the Service/Eventing Tree View
* `Knative: Add a Tag`: Add a new tag to a Revision
* `Knative: Delete`: Delete a service or a revision or an eventing resource
* `Knative: Open in Browser`: Open the service in your browser

## Documentation

- [What is OpenShift Serverless](https://www.redhat.com/en/technologies/cloud-computing/openshift/serverless)
- [Setting up OpenShift Serverless Functions - Red Hat Official Documentation](https://docs.openshift.com/container-platform/4.11/serverless/functions/serverless-functions-setup.html)
- [Serverless Function CLI docs](https://github.com/knative/func)
- [Knative Docs](https://knative.dev/docs/)

## Release Notes

> See [CHANGELOG](CHANGELOG.md) for details.

## Contributing

This is an open-source project open to anyone. We are always looking for contributions from the Function Developer community.

For information on getting started, please take a look at the [CONTRIBUTING instructions](CONTRIBUTING.md).

Download the most recent `knative-<version>.vsix` file from the [release](https://github.com/redhat-developer/vscode-knative/releases) and install it by following the instructions [here](https://code.visualstudio.com/docs/editor/extension-gallery#_install-from-a-vsix). Stable releases are archived [here](https://download.jboss.org/jbosstools/adapters/stable/vscode-knative/).

## Feedback & Questions

If you find an issue, please file a bug and we will fix it as soon as possible.
* File a bug in [GitHub Issues](https://github.com/redhat-developer/vscode-knative/issues).
* Open a [Discussion on GitHub](https://github.com/redhat-developer/vscode-knative/discussions).

The func Task Force meets @ 10:30 PST every Tuesday, we'd love to have you! For more information, see the invitation on the [Knative Team Calendar](https://calendar.google.com/calendar/u/0/embed?src=knative.team_9q83bg07qs5b9rrslp5jor4l6s@group.calendar.google.com).

## License

MIT, See [LICENSE](LICENSE) for more information.

## Data and telemetry

The Knative extension for Visual Studio Code collects anonymous [usage data](USAGE_DATA.md) and sends it to Red Hat servers to help improve our products and services. Read our [privacy statement](https://developers.redhat.com/article/tool-data-collection) to learn more. This extension respects the `redhat.telemetry.enabled` setting which you can learn more about at https://github.com/redhat-developer/vscode-commons#how-to-disable-telemetry-reporting


