var Router = require('./router');
var dgram = require('dgram');
var defaults = require('./defaults');
var packetHelper = require('./network/packetHelper');

exports = module.exports = app;

app.prototype.options = {};


/*
 * Sets up the application to handle receiving of packets over UDP
 * Usage:
 * var app = swg({
 *	verbose: true
 * });
 */
function app(options) {
	var _this = this;
	this.options = options;
	var router = this._router = new Router(options);
	this.server = dgram.createSocket('udp4');

	this.lastAck = -1;

	this.server.on('message', function(buffer, requestInfo) {

		packetHelper.bufferToPacket({
			buffer: buffer,
			crcSeed: defaults.crcSeed,
			crcLength: defaults.crcLength
		}, function(err, packet) {
			if (err) console.log(err);

			if (_this.options.verbose) {
				// console.log('received packet:', packet);
				console.log('C -> S', buffer.toString('hex'));
			}

			if (defaults.shouldAcknowledgePackets && packet.sequence > _this.lastAck) {
				_this.lastAck = packet.sequence;
				_this.acknowledge(packet.sequence, requestInfo.port, requestInfo.address);
			}

			var req = {
				packet: packet,
				res: res,
				requestInfo: requestInfo
			};
			var res = {
				req: req,
				sendPacket: function(packet) {
					_this.send({
						packet: packet,
						port: requestInfo.port,
						address: requestInfo.address
					});
				}
			};

			router.middleware(req, res, function() {});
		});
	});
};


/*
 * Override default values found in defaults.js
 */
app.prototype.setDefault = function(key, value) {
	defaults[key] = value;
};


/*
 * Start the server listening on a certain port
 */
app.prototype.listen = function(port, callback) {
	this.server.on('listening', callback);
	this.server.bind(port || defaults.port);
};


/*
 * Helper method to let you set routes
 * Usage: app.on('LoginClientId', function(req, res, next) { });
 */
app.prototype.on = function() {
	this._router.register.apply(this._router, arguments);
};


/*
 * Use this function to send a packet using a packet name and the packet data
 */
app.prototype.send = function(options, callback) {
	var _this = this;
	var packet = packetHelper.parseObjIntoPacket(options.packet);

	if (this.options.verbose) {
		// console.log('sending packet:', options.packet);
	}

	packetHelper.packetToBuffer({
			packet: packet,
			crcSeed: options.crcSeed || defaults.crcSeed,
			crcLength: options.crcLength || defaults.crcLength
		}, function(err, buffer) {
			if(!err && buffer) {
				if (_this.options.verbose) {
					// console.log('sending packet:', options.packet);
					console.log('S -> C', buffer.toString('hex'));
				}
				_this.sendRaw(buffer, options.port, options.address);
			}
			if(callback) callback(err);
	});
};

app.prototype.sendRaw = function(buffer, port, address) {
	if(!Buffer.isBuffer(buffer) && typeof buffer == 'string') {
		buffer = Buffer.from(buffer, 'hex');
	}

	this.server.send(buffer, 0, buffer.length, port, address);
};


/*
 *
 */
app.prototype.acknowledge = function(sequence, port, address) {
	var buffer = new Buffer('0015' + sequence);
	this.send({
		packet: {
			name: 'SOE_ACK_A',
			sequence: sequence
		},
		port: port,
		address: address
	});
};