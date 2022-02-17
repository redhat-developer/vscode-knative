[![Visual Studio Marketplace](https://vsmarketplacebadge.apphb.com/version/redhat.vscode-knative.svg)](https://marketplace.visualstudio.com/items?itemName=redhat.vscode-knative)
![CI](https://github.com/talamer/vscode-knative/workflows/CI/badge.svg)
[![Unit Tests Code Coverage](https://codecov.io/gh/redhat-developer/vscode-knative/branch/main/graph/badge.svg)](https://codecov.io/gh/redhat-developer/vscode-knative/branch/main/graph/badge.svg)
[![License](https://img.shields.io/badge/license-MIT-brightgreen.svg)](https://github.com/redhat-developer/vscode-knative/blob/master/LICENSE)

# Knative Serving & Eventing for Visual Studio Code

[Knative](https://knative.tips/intro/knative/) (pronounced kay-native) is a set of open source components for Kubernetes that implements functionality to:

  * run stateless workloads such as micro-services
  * event subscription, delivery and handling

on Kubernetes clusters.

This extension for Knative provides the app developer the tools and experience needed when working with Knative on a Kubernetes cluster. Using this extension, developers can view and deploy their applications in a serverless way.

<!-- ## Features

Describe specific features of your extension including screenshots of your extension in action. Image paths are relative to this README file.

For example if there is an image subfolder under your extension project workspace:

\!\[feature X\]\(images/feature-x.png\)

> Tip: Many popular extensions utilize animations. This is an excellent way to show off your extension! We recommend short, focused animations that are easy to follow. -->

## Requirements

* YAML is validated using the [VSCode-YAML](https://marketplace.visualstudio.com/items?itemName=redhat.vscode-yaml)
  
* Login in to a Kubernetes cluster is done via the [Kubernetes extension](https://marketplace.visualstudio.com/items?itemName=ms-kubernetes-tools.vscode-kubernetes-tools) (ms-kubernetes-tools.vscode-kubernetes-tools). 

  > NOTE: You will need to have the [kubeconfig](https://kubernetes.io/docs/concepts/configuration/organize-cluster-access-kubeconfig/#the-kubeconfig-environment-variable) for the cluster that you are accessing stored locally.

*  Knative uses [kn cli](https://github.com/knative/client) and [func cli](https://github.com/knative-sandbox/kn-plugin-func). The extension will offer to download and install the dependencies if needed.

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

`vscode-knative` supports a number of commands for interacting with Knative and Knative Functions; these are accessible via the tree context menu and/or the command menu (Ctrl+Shift+P).

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

## Known Issues

> BUGS: Please check the [issues](https://github.com/redhat-developer/vscode-knative/issues) and report any you find.
* Limited features due to Alpha level of development.

## Contributing

> To learn how to contribute, please see this [guide](https://github.com/redhat-developer/vscode-knative/blob/main/CONTRIBUTING.md).

## Release Notes

> See [CHANGELOG](CHANGELOG.md) for details.

### 0.9.0

-  Add Eventing tree and display.

### 0.8.0

-  Add schema validation for Service YAML files.

### 0.7.0

- Edit Service YAML files and Apply them to the cluster.

### 0.6.0

- Display and Add Tags to Revisions

### 0.5.0

- Display Traffic percentage on the Revisions

### 0.4.0

- Display yaml file for Services and Revisions when selected
- Support Deletion of Services and Revisions

### 0.3.0

- Display Revisions for each Service

### 0.2.0

- Create Service (Deploy Container Image)

### 0.1.0

- Initial release of the Knative extension
- Display a list of Services
