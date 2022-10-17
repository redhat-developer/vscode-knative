# How to contribute

Contributions are essential for keeping this extension great.
We try to keep it as easy as possible to contribute changes and we are
open to suggestions for making it even easier.
There are only a few guidelines that we need contributors to follow.

## First Time Setup
1. Install prerequisites:
   * latest [Visual Studio Code](https://code.visualstudio.com/)
   * [Node.js](https://nodejs.org/) v16.0.0 or higher
2. Fork and clone the repository
3. `cd vscode-knative`
4. Install the dependencies:

	```bash
	$ npm install
	```
5. Open the folder in VS Code

## Developing the extension
We strongly suggest that you use [Prettier](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode) and [ESlint](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint) to ease the development of the extension. We are using multiple tools to keep codebase clean, maintainable and code readable.
1. Once you have all package dependencies installed (`npm install`) you can compile the extension, so you are sure you have all the dependencies installed correctly:
    ```
    npm run build
    ```
2. Now you can run unit tests suite by going to the `Run` tab and launching `Extension Tests (vscode-knative)` task.
3. Or you can run tests from the CLI:
    ```
    npm test
    ```
4. To run extension in VSCode using the code directly from the workspace, launch `Run Extension (vscode-knative)` task.

## Installing the extension from the source code

1. Install `vsce` - A command line tool you'll use to publish extensions to the Extension Marketplace.
    ```bash
    $ npm install -g vsce
    ```
2. From root folder, run the below command.
    ```bash
    $ vsce package
    ```
3. `vscode-knative-<version>.vsix` file is created. Install it by following the instructions [here](https://code.visualstudio.com/docs/editor/extension-gallery#_install-from-a-vsix).


4. Once the extension is installed and reloaded, there will be an Knative Icon on the View Container.

> If you have any questions or run into any problems, please post an issue - we'll be very happy to help.

### Certificate of Origin

By contributing to this project you agree to the Developer Certificate of
Origin (DCO). This document was created by the Linux Kernel community and is a
simple statement that you, as a contributor, have the legal right to make the
contribution. See the [DCO](DCO) file for details.
