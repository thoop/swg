var _ = require('lodash');
var Route = require('./route');
var packetHelper = require('./network/packetHelper');

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
	var identifier = arguments[0];
	var callbacks = _.flatten([].slice.call(arguments, 1));

	//ensure identifier was given
	if (!identifier) throw new Error('You must supply an identifier to app.on');

	//ensure all callbacks are functions
	_.each(callbacks, function(fn) {
		if ('function' == typeof fn) return;
		var type = {}.toString.call(fn);
		throw new Error('app.on requires callback functions but got a ' + type);
	});

	identifier = identifier.toLowerCase();
	if(packetHelper.packets[identifier]) {
		identifier = packetHelper.packets[identifier].opcode.toLowerCase();
	}

	var route = new Route(identifier, callbacks);

	(this.map[identifier] = this.map[identifier] || []).push(route);
	return this;
}

Router.prototype._dispatch = function(req, res, next) {
	var opcode = req.packet.opcode || req.packet.soeOpcode;

	opcode = opcode.toLowerCase();
	if (!this.map[opcode]) {
		console.log('No route matched for ' + opcode + '. Ignoring packet.', req.packet);
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