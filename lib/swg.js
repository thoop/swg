var application = require('./application');

exports = module.exports = createApplication;

function createApplication(options) {
    var app = application;
    app.init(options);
    return app;
}