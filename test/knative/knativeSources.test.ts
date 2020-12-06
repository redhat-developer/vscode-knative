import * as vscode from 'vscode';
import * as chai from 'chai';
import * as sinonChai from 'sinon-chai';
import * as sinon from 'sinon';
import * as referee from '@sinonjs/referee';
import { beforeEach } from 'mocha';
import * as sourceData from '../eventingTree/source.json';
import { KnativeSources, SourceTypes } from '../../src/knative/knativeSources';
import { GenericSource } from '../../src/knative/genericSource';
import { PingSource } from '../../src/knative/pingSource';
import { APIServerSource } from '../../src/knative/apiServerSource';
import { BindingSource } from '../../src/knative/bindingSource';

const { assert } = referee;
const { expect } = chai;
chai.use(sinonChai);

suite('Knative Sources', () => {
  const sandbox = sinon.createSandbox();
  const knativeSources: KnativeSources = KnativeSources.Instance;
  const testSource0: APIServerSource = new APIServerSource(
    'exampleSource0',
    'Sources',
    '',
    'aaa',
    JSON.parse(JSON.stringify(sourceData.items[0])),
  );
  const testSource1: PingSource = new PingSource(
    'exampleSource1',
    'Sources',
    '*/2 * * * *',
    '{ value: "hello" }',
    'aaa',
    JSON.parse(JSON.stringify(sourceData.items[1])),
  );
  const testSource2: GenericSource = new GenericSource(
    'exampleSource2',
    'Sources',
    'UnknownSource',
    null,
    JSON.parse(JSON.stringify(sourceData.items[2])),
  );
  const testSource3: BindingSource = new BindingSource(
    'exampleSource3',
    'Sources',
    'knative-tut',
    'aaa',
    JSON.parse(JSON.stringify(sourceData.items[3])),
  );
  let testSources: SourceTypes[];

  beforeEach(() => {
    sandbox.stub(vscode.window, 'showErrorMessage').resolves();
    testSources = [testSource0, testSource1, testSource2, testSource3];
    knativeSources.addSources(testSources);
  });

  teardown(() => {
    sandbox.restore();
  });

  suite('Getting an instance', () => {
    test('should return an instance of the singleton', () => {
      const instance: KnativeSources = KnativeSources.Instance;
      assert.equals(instance, knativeSources);
    });
  });
  suite('Getting a Source', () => {
    test('should return a list of sources from the instance', () => {
      const returnedSource: SourceTypes = knativeSources.getSources()[0];
      assert.equals(testSource0, returnedSource);
    });
  });
  suite('Finding a Source', () => {
    test('should return a source using the source name', () => {
      const returnedSource: SourceTypes = knativeSources.findSource('exampleSource0');
      assert.equals(testSource0, returnedSource);
    });
  });
  suite('Adding a Source', () => {
    test('should add a source and return the source added', () => {
      const remainingSources: SourceTypes[] = knativeSources.removeSource('exampleSource1');
      expect(remainingSources).to.have.lengthOf(3);
      const returnedSource: SourceTypes = knativeSources.addSource(testSource1);
      assert.equals(testSource1, returnedSource);
    });
  });
  suite('Adding multiple Sources', () => {
    test('should add a list of sources return a list of sources added', () => {
      const remainingSources: SourceTypes[] = knativeSources.removeSource('exampleSource1');
      expect(remainingSources).to.have.lengthOf(3);
      const returnedSources: SourceTypes[] = knativeSources.addSources(testSources);
      assert.equals(testSources, returnedSources);
    });
  });
  suite('Updating a Source', () => {
    test('should return a list of sources, including the updated one', () => {
      const returnedSources: SourceTypes[] = knativeSources.updateSource(testSource1);
      assert.equals(testSources, returnedSources);
    });
  });
});
