// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import { KnativeExplorer } from './explorer';
import { Service } from './knative/service';
import { Kn, KnImpl } from './kn/knController';
import { KnAPI } from './kn/kn-api';


// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with registerCommand
	// The commandId parameter must match the command field in package.json
	let disposable = [
		// vscode.commands.registerCommand('knative.service.list', () => Service.list()),
		vscode.commands.registerCommand('knative.service.list', (context) => execute(Service.list, context)),
		vscode.commands.registerCommand('knative.explorer.reportIssue', () => KnativeExplorer.reportIssue()),
		// vscode.commands.registerCommand('knative.service.create', (context) => execute(Project.create, context)),
        KnativeExplorer.getInstance()
	];

	// context.subscriptions.push(disposable);
	disposable.forEach((value) => context.subscriptions.push(value));
}

// this method is called when your extension is deactivated
export function deactivate() {}

function displayResult(result?: any) {
    if (result && typeof result === 'string') {
        vscode.window.showInformationMessage(result);
    }
}

function execute<T>(command: (...args: T[]) => Promise<any> | void, ...params: T[]) {
    try {
        const res = command.call(null, ...params);
        return res && res.then
            ? res.then((result: any) => {
                displayResult(result);

            }).catch((err: any) => {
                vscode.window.showErrorMessage(err.message ? err.message : err);
            })
            : undefined;
    } catch (err) {
        vscode.window.showErrorMessage(err);
    }
}
