const path = require('path');

const appiumHost = process.env.APPIUM_HOST || '127.0.0.1';
const appiumPort = Number(process.env.APPIUM_PORT || 4723);
const deviceName = process.env.DEVICE_NAME || 'emulator-5554';
const appPackage = process.env.APP_PACKAGE || 'com.oncolens.ai';
const appActivity = process.env.APP_ACTIVITY || 'host.exp.exponent';

exports.config = {
  runner: 'local',
  specs: [path.join(__dirname, 'test', 'specs', '**', '*.js')],
  maxInstances: 1,
  capabilities: [{
    platformName: 'Android',
    'appium:automationName': 'UiAutomator2',
    'appium:deviceName': deviceName,
    'appium:appPackage': appPackage,
    'appium:appActivity': appActivity,
    'appium:noReset': true
  }],
  hostname: appiumHost,
  port: appiumPort,
  logLevel: 'info',
  framework: 'mocha',
  mochaOpts: {
    timeout: 600000
  },
  reporters: ['spec']
};
