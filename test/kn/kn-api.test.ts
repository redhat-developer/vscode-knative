import * as assert from 'assert';
import { KnAPI } from '../../src/kn/kn-api';
import { CliCommand } from '../../src/kn/knCli';

import rewire = require('rewire');

suite('New Command', () => {
  test('should create a proper command string', () => {
    const api = rewire('../../src/kn/kn-api');
    const newKnCommand = api.__get__('newKnCommand');
    const knArguments: string[] = ['service', 'list'];
    const commandApi: CliCommand = newKnCommand(knArguments);
    const command: CliCommand = {
      cliArguments: ['service', 'list'],
      cliCommand: 'kn',
    };

    assert.deepEqual(command, commandApi);
  });
});

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
      const command: CliCommand = {
        cliArguments: ['service', 'create', 'mysvc', '--image', 'dev.local/ns/image:latest'],
        cliCommand: 'kn',
      };
      const commandAPI = KnAPI.createService({ name: 'mysvc', image: 'dev.local/ns/image:latest' });
      assert.deepEqual(command.cliArguments, commandAPI.cliArguments);
    });
    test('should create a service with image using --force flag', () => {
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
    test('should create a service with a port', () => {
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
    test('should create a service with multiple environment variables', () => {
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
    test('should create a service with name, image, and namespace', () => {
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
    test('should create a service with annotations', () => {
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
    test('should create a service with all the options applied', () => {
      const command: CliCommand = {
        cliArguments: [
          'service',
          'create',
          '--force',
          'mysvc',
          '--port',
          '80',
          '--env',
          'KEY1=NEW_VALUE1',
          '--env',
          'NEW_KEY2=NEW_VALUE2',
          '--image',
          'dev.local/ns/image:latest',
          '-n',
          'myns',
          '--annotation',
          'sidecar.istio.io/inject=false',
          '--annotation',
          'sidecar.istio.io/list=true',
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
        force: true,
        port: 80,
        env: envMap,
        namespace: 'myns',
        annotation: annoationMap,
        label: labelMap,
      });
      assert.deepEqual(command.cliArguments, commandAPI.cliArguments);
    });
  });
  suite('Update a Service', () => {
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

    const limitMap = new Map([
      ['key1', 'limit1'],
      ['key2', 'LIMIT2'],
    ]);

    const requestMap = new Map([
      ['key1', 'request1'],
      ['key2', 'REQUEST2'],
    ]);

    const tagMap = new Map([
      ['key1', 'tag1'],
      ['key2', 'TAG2'],
    ]);

    const trafficMap = new Map([
      ['key1', 'traffic1'],
      ['key2', 'TRAFFIC2'],
    ]);

    const untagMap = new Map([
      ['key1', 'untag1'],
      ['key2', 'UNTAG2'],
    ]);

    test('should update a service with name and image', () => {
      const command: CliCommand = {
        cliArguments: ['service', 'update', 'mysvc', '--image', 'dev.local/ns/image:latest'],
        cliCommand: 'kn',
      };
      const commandAPI = KnAPI.updateService({ name: 'mysvc', image: 'dev.local/ns/image:latest' });
      assert.deepEqual(command.cliArguments, commandAPI.cliArguments);
    });
    test('should update a service with a port', () => {
      const command: CliCommand = {
        cliArguments: ['service', 'update', 'mysvc', '--port', '80'],
        cliCommand: 'kn',
      };
      const commandAPI = KnAPI.updateService({
        name: 'mysvc',
        port: 80,
      });
      assert.deepEqual(command.cliArguments, commandAPI.cliArguments);
    });
    test('should update a service with multiple environment variables', () => {
      const command: CliCommand = {
        cliArguments: ['service', 'update', 'mysvc', '--env', 'KEY1=NEW_VALUE1', '--env', 'NEW_KEY2=NEW_VALUE2'],
        cliCommand: 'kn',
      };
      const commandAPI = KnAPI.updateService({
        name: 'mysvc',
        env: envMap,
      });
      assert.deepEqual(command.cliArguments, commandAPI.cliArguments);
    });
    test('should update a service with name and namespace', () => {
      const command: CliCommand = {
        cliArguments: ['service', 'update', 'mysvc', '-n', 'myns'],
        cliCommand: 'kn',
      };
      const commandAPI = KnAPI.updateService({
        name: 'mysvc',
        namespace: 'myns',
      });
      assert.deepEqual(command.cliArguments, commandAPI.cliArguments);
    });
    test('should update a service with annotations', () => {
      const command: CliCommand = {
        cliArguments: [
          'service',
          'update',
          'mysvc',
          '--annotation',
          'sidecar.istio.io/inject=false',
          '--annotation',
          'sidecar.istio.io/list=true',
        ],
        cliCommand: 'kn',
      };
      const commandAPI = KnAPI.updateService({
        name: 'mysvc',
        annotation: annoationMap,
      });
      assert.deepEqual(command.cliArguments, commandAPI.cliArguments);
    });
    test('should update a service with labels', () => {
      const command: CliCommand = {
        cliArguments: ['service', 'update', 'mysvc', '--label', 'key1=label1', '--label', 'key2=LABEL2'],
        cliCommand: 'kn',
      };
      const commandAPI = KnAPI.updateService({
        name: 'mysvc',
        label: labelMap,
      });
      assert.deepEqual(command.cliArguments, commandAPI.cliArguments);
    });
    test('should update a service with limits', () => {
      const command: CliCommand = {
        cliArguments: ['service', 'update', 'mysvc', '--limit', 'key1=limit1', '--limit', 'key2=LIMIT2'],
        cliCommand: 'kn',
      };
      const commandAPI = KnAPI.updateService({
        name: 'mysvc',
        limit: limitMap,
      });
      assert.deepEqual(command.cliArguments, commandAPI.cliArguments);
    });
    test('should update a service with requests', () => {
      const command: CliCommand = {
        cliArguments: ['service', 'update', 'mysvc', '--request', 'key1=request1', '--request', 'key2=REQUEST2'],
        cliCommand: 'kn',
      };
      const commandAPI = KnAPI.updateService({
        name: 'mysvc',
        request: requestMap,
      });
      assert.deepEqual(command.cliArguments, commandAPI.cliArguments);
    });
    test('should update a service with tags', () => {
      const command: CliCommand = {
        cliArguments: ['service', 'update', 'mysvc', '--tag', 'key1=tag1', '--tag', 'key2=TAG2'],
        cliCommand: 'kn',
      };
      const commandAPI = KnAPI.updateService({
        name: 'mysvc',
        tag: tagMap,
      });
      assert.deepEqual(command.cliArguments, commandAPI.cliArguments);
    });
    test('should update a service with traffic', () => {
      const command: CliCommand = {
        cliArguments: ['service', 'update', 'mysvc', '--traffic', 'key1=traffic1', '--traffic', 'key2=TRAFFIC2'],
        cliCommand: 'kn',
      };
      const commandAPI = KnAPI.updateService({
        name: 'mysvc',
        traffic: trafficMap,
      });
      assert.deepEqual(command.cliArguments, commandAPI.cliArguments);
    });
    test('should update a service with untag', () => {
      const command: CliCommand = {
        cliArguments: ['service', 'update', 'mysvc', '--untag', 'key1=untag1', '--untag', 'key2=UNTAG2'],
        cliCommand: 'kn',
      };
      const commandAPI = KnAPI.updateService({
        name: 'mysvc',
        untag: untagMap,
      });
      assert.deepEqual(command.cliArguments, commandAPI.cliArguments);
    });
    test('should update a service with all the options applied', () => {
      const command: CliCommand = {
        cliArguments: [
          'service',
          'update',
          'mysvc',
          '--image',
          'dev.local/ns/image:latest',
          '--port',
          '80',
          '-n',
          'myns',
          '--env',
          'KEY1=NEW_VALUE1',
          '--env',
          'NEW_KEY2=NEW_VALUE2',
          '--annotation',
          'sidecar.istio.io/inject=false',
          '--annotation',
          'sidecar.istio.io/list=true',
          '--label',
          'key1=label1',
          '--label',
          'key2=LABEL2',
          '--limit',
          'key1=limit1',
          '--limit',
          'key2=LIMIT2',
          '--request',
          'key1=request1',
          '--request',
          'key2=REQUEST2',
          '--tag',
          'key1=tag1',
          '--tag',
          'key2=TAG2',
          '--traffic',
          'key1=traffic1',
          '--traffic',
          'key2=TRAFFIC2',
          '--untag',
          'key1=untag1',
          '--untag',
          'key2=UNTAG2',
        ],
        cliCommand: 'kn',
      };
      const commandAPI = KnAPI.updateService({
        name: 'mysvc',
        image: 'dev.local/ns/image:latest',
        port: 80,
        namespace: 'myns',
        env: envMap,
        annotation: annoationMap,
        label: labelMap,
        limit: limitMap,
        request: requestMap,
        tag: tagMap,
        traffic: trafficMap,
        untag: untagMap,
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

  suite('Describe Features', () => {
    test('should return command for describing the service foo in JSON', () => {
      const feature = 'service';
      const name = 'foo';
      const outputFormat = 'json';
      const command: CliCommand = {
        cliArguments: [feature, 'describe', name, '-o', outputFormat],
        cliCommand: 'kn',
      };
      assert.deepEqual(command.cliArguments, KnAPI.describeFeature(feature, name, outputFormat).cliArguments);
    });
    test('should return command for describing the service foo in YAML', () => {
      const feature = 'service';
      const name = 'foo';
      const outputFormat = 'yaml';
      const command: CliCommand = {
        cliArguments: [feature, 'describe', name, '-o', outputFormat],
        cliCommand: 'kn',
      };
      assert.deepEqual(command.cliArguments, KnAPI.describeFeature(feature, name, outputFormat).cliArguments);
    });
  });

  suite('Delete Features', () => {
    test('should return command for deleting the service foo', () => {
      const feature = 'service';
      const name = 'foo';
      const command: CliCommand = {
        cliArguments: [feature, 'delete', name],
        cliCommand: 'kn',
      };
      assert.deepEqual(command.cliArguments, KnAPI.deleteFeature(feature, name).cliArguments);
    });
  });

  suite('List Routes', () => {
    test('should return command for listing all routes', () => {
      const command: CliCommand = {
        cliArguments: ['route', 'list', '-o', 'json'],
        cliCommand: 'kn',
      };
      assert.deepEqual(command.cliArguments, KnAPI.listRoutes().cliArguments);
    });
    test('should return command for listing routes for a service', () => {
      const sname = 'myservice';
      const command: CliCommand = {
        cliArguments: ['route', 'list', sname, '-o', 'json'],
        cliCommand: 'kn',
      };
      assert.deepEqual(command.cliArguments, KnAPI.listRoutesForService(sname).cliArguments);
    });
  });

  suite('Print version', () => {
    test('should return command for printing the version of KN', () => {
      const command: CliCommand = {
        cliArguments: ['version'],
        cliCommand: 'kn',
      };
      assert.deepEqual(command.cliArguments, KnAPI.printKnVersion().cliArguments);
    });
  });
});
