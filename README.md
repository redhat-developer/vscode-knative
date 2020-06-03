<!-- ![CI](https://github.com/talamer/vscode-knative/workflows/CI/badge.svg) -->

# Knative Serving & Eventing for Visual Studio Code

[Knative](https://knative.tips/intro/knative/) (pronounced kay-native) is a set of open source components for Kubernetes that implements functionality to:

  * run stateless workloads such as microservices
  * event subscription, delivery and handling

on Kubernetes clusters.

This extension for Knative provides the app developer the tools and experience needed when working with Knative on a Kubernetes cluster. Using this extension, developers can view and deploy their applications in a serverless way.

<!-- ## Features

Describe specific features of your extension including screenshots of your extension in action. Image paths are relative to this README file.

For example if there is an image subfolder under your extension project workspace:

\!\[feature X\]\(images/feature-x.png\)

> Tip: Many popular extensions utilize animations. This is an excellent way to show off your extension! We recommend short, focused animations that are easy to follow. -->

## Requirements

  * Logging in to a Kubernetes cluster is done via the [Kubernetes extension](https://marketplace.visualstudio.com/items?itemName=ms-kubernetes-tools.vscode-kubernetes-tools) (ms-kubernetes-tools.vscode-kubernetes-tools). 

  > NOTE: You will need to have the [kubeconfig](https://kubernetes.io/docs/concepts/configuration/organize-cluster-access-kubeconfig/#the-kubeconfig-environment-variable) for the cluster that you are accessing stored locally.

*  Knative is run on the [kn cli](https://github.com/knative/client). The extension will offer to download and install it if it can't find it.

## Extension Settings

This extension contributes the following settings:

* `service.explorer.create`: Create a new Knative service in the current namespace
* `service.explorer.openFile`: Display yaml for selected item
* `service.explorer.refresh`: Refresh the Explorer tree view
* `service.explorer.reportIssue`: Report Extension Issue on GitHub
* `knative.service.open-in-browser`: Open the list of Services in the browser

## Known Issues

> BUGS: Please check the [issues](https://github.com/talamer/vscode-knative/issues?q=is%3Aissue+is%3Aopen+label%3Akind%2Fbug) and report any you find.
* Limited features due to Alpha level of development.

## Release Notes

> See [CHANGELOG](CHANGELOG.md) for details.

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
