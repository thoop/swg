/*
 * Parent for swg packets.
 */
 var _ = require('lodash');

var packet = exports = module.exports = {};


packet.parseObjIntoPacket = function(packetObj) {
	var newPacket = {
		soeOpcode: '0009'
	};

	var returnedPacket = Object.getPrototypeOf(packet).parseObjIntoPacket.apply(this, [packetObj]);

	packetObj.opcode = this.opcode.toLowerCase();
	packetObj.operandCount = this.operandCount;
	newPacket.swgPackets = [packetObj];
	return newPacket;
}


packet.packetToBuffer = function(options, callback) {
	var buffer = Buffer.from(this.opcode, 'hex');
	var operandCount = Buffer.from(this._getHexInt(this.operandCount, 4), 'hex');

	Object.getPrototypeOf(packet).packetToBuffer.apply(this, [options, function(err, parsedBuffer) {
		if(err) return callback(err, null);

		callback(null, Buffer.concat([operandCount.swap16(), buffer.swap32(), parsedBuffer]));
	}]);
};

Object.setPrototypeOf(packet, require('../packet'));