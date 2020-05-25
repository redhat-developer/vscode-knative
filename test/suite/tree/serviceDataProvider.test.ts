import * as chai from 'chai';
import * as sinonChai from 'sinon-chai';
import * as sinon from 'sinon';
import { ServiceDataProvider } from '../../../src/tree/serviceDataProvider';
import * as singleServiceData from './singleServiceServiceList.json';

const { expect } = chai;
chai.use(sinonChai);

suite('ServiceDataProvider', () => {
  const sandbox = sinon.createSandbox();
  const serviceDataProvider = new ServiceDataProvider();

  teardown(() => {
    sandbox.restore();
  });
  suite('No Services', () => {
    test('getChildren should return the No Services node when KN execute returns "No Services found"', async () => {
      sandbox.stub(serviceDataProvider.knExecutor, 'execute').resolves({ error: undefined, stdout: 'No services found.' });
      const result = await serviceDataProvider.getChildren();
      expect(result).to.have.lengthOf(1);
      expect(result[0].description).equals('');
      expect(result[0].label).equals('No Service Found');
      expect(result[0].getName()).equals('No Service Found');
    });
  });

  suite('Single service', () => {
    test('getChildren should return single node', async () => {
      sandbox
        .stub(serviceDataProvider.knExecutor, 'execute')
        .resolves({ error: undefined, stdout: JSON.stringify(singleServiceData) });
      const result = await serviceDataProvider.getChildren();
      expect(result).to.have.lengthOf(1);
      expect(result[0].description).equals('');
      expect(result[0].label).equals('greeter');
      expect(result[0].getName()).equals('greeter');
      expect(result[0].tooltip).equals('Service: greeter');
    });
  });
});
