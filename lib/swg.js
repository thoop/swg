var Application = require('./application');

exports = module.exports = createApplication;

function createApplication(options) {
    return new Application(options);
}