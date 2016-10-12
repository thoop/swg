/*
 * Parent for soe packets. Overrides bufferToPacket to parse soeopcode off buffer.
 */
 var _ = require('lodash');

var packet = exports = module.exports = {};

packet.bufferToPacket = function(options, callback) {
	var soeOpcode =  options.buffer.slice(0, 2).toString('hex')

	options.buffer = options.buffer.slice(2);

	Object.getPrototypeOf(packet).bufferToPacket.apply(this, [options, function(err, parsedPacket) {

		parsedPacket.soeOpcode = soeOpcode;
		callback(null, parsedPacket);
	}]);
}


packet.parseObjIntoPacket = function(packetObj) {
	var newPacket = {
		soeOpcode: this.opcode
	}

	var returnedPacket = Object.getPrototypeOf(packet).parseObjIntoPacket.apply(this, [packetObj]);

	return _.merge(newPacket, returnedPacket);
}


packet.packetToBuffer = function(options, callback) {
	var buffer = Buffer.from(this.opcode, 'hex');

	Object.getPrototypeOf(packet).packetToBuffer.apply(this, [options, function(err, parsedBuffer) {

		callback(null, Buffer.concat([buffer, parsedBuffer]));
	}]);
}



Object.setPrototypeOf(packet, require('../packet'));