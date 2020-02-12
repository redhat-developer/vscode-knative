# Knative Servering & Eventing for Visual Studio Code

[Knative](https://knative.tips/intro/knative/) (pronounced kay-native) is a set of open source components for Kubernetes that implements functionality to:

  - run stateless workloads such as microservices
  - event subscription, delivery and handling

on Kubernetes clusters.

This extension for Knative provides a complete developer experience when working with a Kubernetes cluster. Using this extension, developers can view and deploy their applications in a serverless way.

<!-- ## Features

Describe specific features of your extension including screenshots of your extension in action. Image paths are relative to this README file.

For example if there is an image subfolder under your extension project workspace:

\!\[feature X\]\(images/feature-x.png\)

> Tip: Many popular extensions utilize animations. This is an excellent way to show off your extension! We recommend short, focused animations that are easy to follow. -->

## Requirements

Logging in to a Kubernetes cluster is done via the [Kubernetes extension](https://marketplace.visualstudio.com/items?itemName=ms-kubernetes-tools.vscode-kubernetes-tools) (ms-kubernetes-tools.vscode-kubernetes-tools), VSCode should ask you to install it if you don't already have it. 

> NOTE: You will need to have the kubeconfig for the cluster that you are accessing stored locally.

Knative is run on the [kn cli](https://github.com/knative/client). The extension will offer to download and install it if it can't find it.

## Extension Settings

Include if your extension adds any VS Code settings through the `contributes.configuration` extension point.

For example:

This extension contributes the following settings:

* `myExtension.enable`: enable/disable this extension
* `myExtension.thing`: set to `blah` to do something

## Known Issues

Limited features due to Alpha level of development.

## Release Notes

### 0.1.0

Initial release of the Knative extension
