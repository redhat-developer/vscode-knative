// import * as assert from 'assert';
// import KnAPI from '../../../kn/kn-api';
// import { CliCommand } from '../../../kn/knCli';

suite('KN API commands that will', () => {
  // suite('Create a Service', () => {
  //   const envMap = new Map([
  //     ['key1', 'new_Value1'],
  //     ['new_key2', 'NEW_VALUE2'],
  //   ]);

  //   const annoationMap = new Map([
  //     ['sidecar.istio.io/inject', false],
  //     ['sidecar.istio.io/list', true],
  //   ]);

  //   const labelMap = new Map([
  //     ['key1', 'label1'],
  //     ['key2', 'LABEL2'],
  //   ]);

  //   test('should create a service with name and image', () => {
  //     const command = 'kn service create mysvc --image dev.local/ns/image:latest';
  //     const commandAPI = KnAPI.createService({ name: 'mysvc', image: 'dev.local/ns/image:latest' });
  //     assert.equal(command, commandAPI);
  //   });
  //   test('should create a service with name, image, and namespace', () => {
  //     const command = 'kn service create mysvc --image dev.local/ns/image:latest -n myns';
  //     const commandAPI = KnAPI.createService({
  //       name: 'mysvc',
  //       image: 'dev.local/ns/image:latest',
  //       namespace: 'myns',
  //     });
  //     assert.equal(command, commandAPI);
  //   });
  //   test('should create a service with image using --force flag', () => {
  //     const command = 'kn service create --force mysvc --image dev.local/ns/image:latest';
  //     const commandAPI = KnAPI.createService({
  //       name: 'mysvc',
  //       image: 'dev.local/ns/image:latest',
  //       force: true,
  //     });
  //     assert.equal(command, commandAPI);
  //   });
  //   test('should create a service with multiple environment variables', () => {
  //     const command =
  //       'kn service create mysvc --env KEY1=NEW_VALUE1 --env NEW_KEY2=NEW_VALUE2 --image dev.local/ns/image:latest';
  //     const commandAPI = KnAPI.createService({
  //       name: 'mysvc',
  //       image: 'dev.local/ns/image:latest',
  //       env: envMap,
  //     });
  //     assert.equal(command, commandAPI);
  //   });
  //   test('should create a service with multiple environment variables using --force flag', () => {
  //     const command =
  //       'kn service create --force mysvc --env KEY1=NEW_VALUE1 --env NEW_KEY2=NEW_VALUE2 --image dev.local/ns/image:latest';
  //     const commandAPI = KnAPI.createService({
  //       name: 'mysvc',
  //       image: 'dev.local/ns/image:latest',
  //       force: true,
  //       env: envMap,
  //     });
  //     assert.equal(command, commandAPI);
  //   });
  //   test('should create a service with a port', () => {
  //     const command = 'kn service create mysvc --port 80 --image dev.local/ns/image:latest';
  //     const commandAPI = KnAPI.createService({
  //       name: 'mysvc',
  //       image: 'dev.local/ns/image:latest',
  //       port: 80,
  //     });
  //     assert.equal(command, commandAPI);
  //   });
  //   test('should create a service with annotations', () => {
  //     const command =
  //       'kn service create mysvc --image dev.local/ns/image:latest --annotation sidecar.istio.io/inject=false --annotation sidecar.istio.io/list=true';
  //     const commandAPI = KnAPI.createService({
  //       name: 'mysvc',
  //       image: 'dev.local/ns/image:latest',
  //       annotation: annoationMap,
  //     });
  //     assert.equal(command, commandAPI);
  //   });
  //   test('should create a service with labels', () => {
  //     const command =
  //       'kn service create mysvc --image dev.local/ns/image:latest --label key1=label1 --label key2=LABEL2';
  //     const commandAPI = KnAPI.createService({
  //       name: 'mysvc',
  //       image: 'dev.local/ns/image:latest',
  //       label: labelMap,
  //     });
  //     assert.equal(command, commandAPI);
  //   });
  // });
  // suite('List Services', () => {
  //   test('should list all services in the current namespace', () => {
  //     const command = 'kn service list -o json';
  //     // const command: CliCommand = {
  //     //   cliArguments: ['service', 'list', '-o', 'json'],
  //     //   cliCommand: 'kn'
  //     // };
  //     const commandAPI = KnAPI.listServices();
  //     assert.equal(command, commandAPI);
  //   });
  // });
});
