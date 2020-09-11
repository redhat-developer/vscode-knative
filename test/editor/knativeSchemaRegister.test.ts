import * as chai from 'chai';
import * as sinonChai from 'sinon-chai';
// import * as referee from '@sinonjs/referee';
import { beforeEach } from 'mocha';
// import { onRequestSchemaContent, onRequestSchemaURI } from '../../src/editor/knativeSchemaRegister';
import * as serviceSchema from '../../schemas/knservice.json';

import rewire = require('rewire');
import sinon = require('sinon');

const rewiredSchemaRegister = rewire('../../src/editor/knativeSchemaRegister');
const schemaJSON = JSON.stringify(serviceSchema);

// const { assert } = referee;
chai.use(sinonChai);

suite('Register Schema', () => {
  // const sandbox = sinon.createSandbox();
  // eslint-disable-next-line prefer-const
  // let uriMock = sandbox.mock();
  // eslint-disable-next-line prefer-const
  // let contentMock = sandbox.mock();
  const uriMock = rewiredSchemaRegister.__get__('onRequestSchemaURI');
  const contentMock = rewiredSchemaRegister.__get__('onRequestSchemaContent');
  // let uriRestore: { (): void; (): void };
  // let contentRestore: { (): void; (): void };
  const knmsxUriString =
    'knmsx://loadknativecore/service-example.yaml?contextValue%3Dservice%26name%3Dexample%26_%3D1594328823824';
  const knreadonlyUriString =
    'knreadonly://loadknativecore/service-example.yaml?contextValue%3Dservice%26name%3Dexample%26_%3D1594328823824';

  beforeEach(() => {
    // uriRestore = rewiredSchemaRegister.__set__('onRequestSchemaURI', uriMock);
    // contentRestore = rewiredSchemaRegister.__set__('onRequestSchemaContent', contentMock);
  });
  teardown(() => {
    // sandbox.restore();
    // uriRestore();
    // contentRestore();
  });

  test('should return the schema URI when requested', () => {
    const returnedSchema: string = uriMock(knmsxUriString);
    sinon.assert.match(returnedSchema, `knmsx://schema/knative`);
  });
  test('should return undefined when the schema is knreadonly instead of returning the URI', () => {
    const returnedSchema: string = uriMock(knreadonlyUriString);
    sinon.assert.match(returnedSchema, undefined);
  });
  test('should return the schema content', () => {
    const returnedSchema: string = contentMock(knmsxUriString);
    sinon.assert.match(returnedSchema, schemaJSON);
  });
  test('should return undefined when the schema ia knreadonly instead of returning the schema content', () => {
    const returnedSchema: string = contentMock(knreadonlyUriString);
    sinon.assert.match(returnedSchema, undefined);
  });
});
