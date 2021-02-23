/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { expect } from 'chai';
import rewire = require('rewire');
import * as serviceSchema from '../../schemas/knservice.json';

const rewiredSchemaRegister = rewire('../../src/editor/knativeSchemaRegister');
const schemaJSON = JSON.stringify(serviceSchema);

suite('Register Schema', () => {
  const uriMock = rewiredSchemaRegister.__get__('onRequestSchemaURI');
  const contentMock = rewiredSchemaRegister.__get__('onRequestSchemaContent');
  const knmsxUriString =
    'knmsx://loadknativecore/service-example.yaml?contextValue%3Dservice%26name%3Dexample%26_%3D1594328823824';
  const knreadonlyUriString =
    'knreadonly://loadknativecore/service-example.yaml?contextValue%3Dservice%26name%3Dexample%26_%3D1594328823824';

  test('should return the schema URI when requested', () => {
    const returnedSchema: string = uriMock(knmsxUriString);
    expect(returnedSchema, `knmsx://schema/knative`);
  });
  test('should return undefined when the schema is knreadonly instead of returning the URI', () => {
    const returnedSchema: string = uriMock(knreadonlyUriString);
    expect(returnedSchema, undefined);
  });
  test('should return the schema content', () => {
    const returnedSchema: string = contentMock(knmsxUriString);
    expect(returnedSchema, schemaJSON);
  });
  test('should return undefined when the schema ia knreadonly instead of returning the schema content', () => {
    const returnedSchema: string = contentMock(knreadonlyUriString);
    expect(returnedSchema, undefined);
  });
});
