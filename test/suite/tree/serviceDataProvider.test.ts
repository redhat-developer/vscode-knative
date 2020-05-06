import * as chai from 'chai';
import * as sinonChai from 'sinon-chai';
import * as sinon from 'sinon';
import {ServiceDataProvider} from '../../../src/tree/serviceDataProvider';

const {expect} = chai;
chai.use(sinonChai);

suite('ServiceDataProvider ', () => {
  const sandbox = sinon.createSandbox();
  const serviceDataProvider = new ServiceDataProvider();

  test('should return the No Services node when KN execute returns "No Services found"', async () => {
    sandbox.stub(serviceDataProvider.knExecutor, "execute").resolves({error: null, stdout: "No services found."});
    const result = await serviceDataProvider.getChildren();
    expect(result).to.have.lengthOf(1);
    expect(result[0].description).equals("No Service Found");
    expect(result[0].label).equals("No Service Found");
    expect(result[0].getName()).equals("No Service Found");
  });


  teardown(()=>{
      sandbox.restore();
  });

});
