var _  = require('lodash')
  , Route = require('./route');

exports = module.exports = Router

function Router(options) {
    var _this = this;
	this.map = {};
	this.options = options || {};
    this.middleware = function(req, res, next) {
        _this._dispatch(req, res, next);
    }
}

Router.prototype.register = function() {
	var identifier = arguments[0]
	  , callbacks = _.flatten([].slice.call(arguments, 1));

	//ensure identifier was given
	if (!identifier) throw new Error('You must supply an identifier to app.on');

	//ensure all callbacks are functions
	_.each(callbacks, function(fn) {
		if ('function' == typeof fn) return;
		var type = {}.toString.call(fn);
		throw new Error('app.on requires callback functions but got a ' + type);
	});

	var route = new Route(identifier, callbacks);

	(this.map[identifier] = this.map[identifier] || []).push(route);
	return this;
}

Router.prototype._dispatch = function(req, res, next){
    var opcode = req.hex.substring(0,4);

    if (this.options.verbose) {
    	console.log('Recieved ' + req.hex + ' from ' + req.requestInfo.address + ':' + req.requestInfo.port);
    }

    if (!this.map[opcode]) {
    	console.log('No route matched for ' + req.hex + '. Ignoring packet.');
    	return;
    }

    var route = this.map[opcode][0];
	var i = 1;

    var next = function() {
        if (!route.callbacks[i]) return;

        route.callbacks[i++].call(this, req, res, next);
    }

	route.callbacks[0].call(route, req, res, next);
}