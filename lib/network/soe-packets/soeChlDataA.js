/*
 * SOE_CHL_DATA_A (Client -> Server OR Server -> Client)
 * Standard packet with containing an swg packet
 *
 * sequence: UDP doesnt include acknowledgement as part of the protocol so
 *					this is a number to be acknowledged that it was received by the receiver.
 */

 var packetHelper = require('../packetHelper');
 var _ = require('lodash');

var packet = exports = module.exports = {
	name: 'soe_chl_data_a',
	opcode: '0009',
	operands: [
		{
			name: 'sequence',
			type: 'short'
		}
	]
};

packet.bufferToPacket = function(options, callback) {
	var _this = this;

	this._checkAndRemoveCRC(options, function(err, buffer) {
		if (err) return callback(err);

		options.buffer = buffer;

		_this._decrypt({
			buffer: buffer,
			crcSeed: options.crcSeed
		}, function(err, buffer) {
			if (err) return callback(err);

			options.buffer = buffer;

			_this._inflateAndRemoveCompressionFlag({
				buffer: buffer,
				crcSeed: options.crcSeed
			}, function(err, buffer) {
				if (err) return callback(err);

				options.buffer = buffer;

				Object.getPrototypeOf(packet).bufferToPacket.apply(_this, [options, function(err, parsedSOEPacket) {

					//move this into swgPacket?
					parsedSOEPacket.operandCount = parsedSOEPacket.extraData.readUInt16LE(0);
					parsedSOEPacket.opcode = parsedSOEPacket.extraData.readUInt32LE(2).toString('16');

					options.buffer = parsedSOEPacket.extraData.slice(6);

					if(!packetHelper.packets[parsedSOEPacket.opcode]) {
						console.log('WARNING: UNKNOWN PACKET:', parsedSOEPacket);
						return callback(err, parsedSOEPacket);
					}

					packetHelper.packets[parsedSOEPacket.opcode].bufferToPacket(options, function(err, parsedSWGPacket) {

						delete parsedSOEPacket.extraData;
						callback(err, _.merge(parsedSOEPacket, parsedSWGPacket));
					});
				}]);
			});
		});
	});
}



packet.packetToBuffer = function(options, callback) {
	var _this = this;

	Object.getPrototypeOf(packet).packetToBuffer.apply(this, [options, function(err, parsedSOEBuffer) {
		if(err) return callback(err, null);

		packetHelper.packets[options.packet.opcode.toLowerCase()].packetToBuffer(options, function(err, parsedSWGBuffer) {
			if(err) return callback(err, null);

			var buff = Buffer.concat([parsedSOEBuffer, parsedSWGBuffer]);

			_this._deflateAndAddCompressionFlag({
				buffer: buff,
				crcSeed: options.crcSeed
			}, function(err, buffer) {
				if (err) return callback(err);

				_this._encrypt({
					buffer: buffer,
					crcSeed: options.crcSeed
				}, function(err, buffer) {
					if (err) return callback(err);

					_this._appendCRC({
						buffer: buffer,
						crcSeed: options.crcSeed
					}, function(err, buffer) {
						if (err) return callback(err);

						callback(null, buffer);
					});
				});
			});
		});
	}]);
}

Object.setPrototypeOf(packet, require('./soePacket'));