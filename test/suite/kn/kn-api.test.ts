import * as assert from 'assert';
import { KnAPI } from '../../../src/kn/kn-api';
import { CliCommand } from '../../../src/kn/knCli';

suite('KN API commands that will', () => {
  suite('Create a Service', () => {
    const envMap = new Map([
      ['key1', 'new_Value1'],
      ['new_key2', 'NEW_VALUE2'],
    ]);

    const annoationMap = new Map([
      ['sidecar.istio.io/inject', false],
      ['sidecar.istio.io/list', true],
    ]);

    const labelMap = new Map([
      ['key1', 'label1'],
      ['key2', 'LABEL2'],
    ]);

    test('should create a service with name and image', () => {
      // const command = 'kn service create mysvc --image dev.local/ns/image:latest';
      const command: CliCommand = {
        cliArguments: ['service', 'create', 'mysvc', '--image', 'dev.local/ns/image:latest'],
        cliCommand: 'kn',
      };
      const commandAPI = KnAPI.createService({ name: 'mysvc', image: 'dev.local/ns/image:latest' });
      assert.deepEqual(command.cliArguments, commandAPI.cliArguments);
    });
    test('should create a service with name, image, and namespace', () => {
      // const command = 'kn service create mysvc --image dev.local/ns/image:latest -n myns';
      const command: CliCommand = {
        cliArguments: ['service', 'create', 'mysvc', '--image', 'dev.local/ns/image:latest', '-n', 'myns'],
        cliCommand: 'kn',
      };
      const commandAPI = KnAPI.createService({
        name: 'mysvc',
        image: 'dev.local/ns/image:latest',
        namespace: 'myns',
      });
      assert.deepEqual(command.cliArguments, commandAPI.cliArguments);
    });
    test('should create a service with image using --force flag', () => {
      // const command = 'kn service create --force mysvc --image dev.local/ns/image:latest';
      const command: CliCommand = {
        cliArguments: ['service', 'create', '--force', 'mysvc', '--image', 'dev.local/ns/image:latest'],
        cliCommand: 'kn',
      };
      const commandAPI = KnAPI.createService({
        name: 'mysvc',
        image: 'dev.local/ns/image:latest',
        force: true,
      });
      assert.deepEqual(command.cliArguments, commandAPI.cliArguments);
    });
    test('should create a service with multiple environment variables', () => {
      // const command =
      //   'kn service create mysvc --env KEY1=NEW_VALUE1 --env NEW_KEY2=NEW_VALUE2 --image dev.local/ns/image:latest';
      const command: CliCommand = {
        cliArguments: [
          'service',
          'create',
          'mysvc',
          '--env',
          'KEY1=NEW_VALUE1',
          '--env',
          'NEW_KEY2=NEW_VALUE2',
          '--image',
          'dev.local/ns/image:latest',
        ],
        cliCommand: 'kn',
      };
      const commandAPI = KnAPI.createService({
        name: 'mysvc',
        image: 'dev.local/ns/image:latest',
        env: envMap,
      });
      assert.deepEqual(command.cliArguments, commandAPI.cliArguments);
    });
    test('should create a service with multiple environment variables using --force flag', () => {
      // const command =
      //   'kn service create --force mysvc --env KEY1=NEW_VALUE1 --env NEW_KEY2=NEW_VALUE2 --image dev.local/ns/image:latest';
      const command: CliCommand = {
        cliArguments: [
          'service',
          'create',
          '--force',
          'mysvc',
          '--env',
          'KEY1=NEW_VALUE1',
          '--env',
          'NEW_KEY2=NEW_VALUE2',
          '--image',
          'dev.local/ns/image:latest',
        ],
        cliCommand: 'kn',
      };
      const commandAPI = KnAPI.createService({
        name: 'mysvc',
        image: 'dev.local/ns/image:latest',
        force: true,
        env: envMap,
      });
      assert.deepEqual(command.cliArguments, commandAPI.cliArguments);
    });
    test('should create a service with a port', () => {
      // const command = 'kn service create mysvc --port 80 --image dev.local/ns/image:latest';
      const command: CliCommand = {
        cliArguments: ['service', 'create', 'mysvc', '--port', '80', '--image', 'dev.local/ns/image:latest'],
        cliCommand: 'kn',
      };
      const commandAPI = KnAPI.createService({
        name: 'mysvc',
        image: 'dev.local/ns/image:latest',
        port: 80,
      });
      assert.deepEqual(command.cliArguments, commandAPI.cliArguments);
    });
    test('should create a service with annotations', () => {
      // const command =
      //   'kn service create mysvc --image dev.local/ns/image:latest --annotation sidecar.istio.io/inject=false --annotation sidecar.istio.io/list=true';
      const command: CliCommand = {
        cliArguments: [
          'service',
          'create',
          'mysvc',
          '--image',
          'dev.local/ns/image:latest',
          '--annotation',
          'sidecar.istio.io/inject=false',
          '--annotation',
          'sidecar.istio.io/list=true',
        ],
        cliCommand: 'kn',
      };
      const commandAPI = KnAPI.createService({
        name: 'mysvc',
        image: 'dev.local/ns/image:latest',
        annotation: annoationMap,
      });
      assert.deepEqual(command.cliArguments, commandAPI.cliArguments);
    });
    test('should create a service with labels', () => {
      // const command =
      //   'kn service create mysvc --image dev.local/ns/image:latest --label key1=label1 --label key2=LABEL2';
      const command: CliCommand = {
        cliArguments: [
          'service',
          'create',
          'mysvc',
          '--image',
          'dev.local/ns/image:latest',
          '--label',
          'key1=label1',
          '--label',
          'key2=LABEL2',
        ],
        cliCommand: 'kn',
      };
      const commandAPI = KnAPI.createService({
        name: 'mysvc',
        image: 'dev.local/ns/image:latest',
        label: labelMap,
      });
      assert.deepEqual(command.cliArguments, commandAPI.cliArguments);
    });
  });
  suite('List Services', () => {
    test('should list all services in the current namespace', () => {
      const command: CliCommand = {
        cliArguments: ['service', 'list', '-o', 'json'],
        cliCommand: 'kn',
      };
      const commandAPI = KnAPI.listServices();
      assert.deepEqual(command.cliArguments, commandAPI.cliArguments);
    });
  });

  suite('List revisions', () => {
    test('should return command for listing all revisions', () => {
      const command: CliCommand = {
        cliArguments: ['revision', 'list', '-o', 'json'],
        cliCommand: 'kn',
      };
      assert.deepEqual(command.cliArguments, KnAPI.listRevisions().cliArguments);
    });
    test('should return command for listing revisions for a service', () => {
      const sname = 'myservice';
      const command: CliCommand = {
        cliArguments: ['revision', 'list', '-o', 'json', '-s', sname],
        cliCommand: 'kn',
      };
      assert.deepEqual(command.cliArguments, KnAPI.listRevisionsForService(sname).cliArguments);
    });
  });
});
