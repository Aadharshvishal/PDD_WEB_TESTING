const assert = require('assert');

describe('Proxenix mobile app smoke tests', function () {
  it('launches the app shell', async function () {
    await driver.pause(2000);
    const source = await driver.getPageSource();
    assert.ok(source.length > 0, 'App source should be available');
  });

  it('renders an interactive UI', async function () {
    await driver.pause(1000);
    const source = await driver.getPageSource();
    assert.ok(source.includes('text') || source.includes('View') || source.includes('ScrollView'), 'Expected UI hierarchy was not found');
  });

  it('can wait for the main screen to settle', async function () {
    await driver.pause(1500);
    const source = await driver.getPageSource();
    assert.ok(source.length > 0, 'Main screen did not settle');
  });
});
