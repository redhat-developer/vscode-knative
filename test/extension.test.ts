import * as assert from 'assert';

import * as vscode from 'vscode';

suite('Knative extension', () => {
  test('should be present', () => {
    assert.ok(vscode.extensions.getExtension('redhat.vscode-knative'));
  });

  test('should activate', async () => {
    await vscode.extensions.getExtension('redhat.vscode-knative').activate();
  });
});
