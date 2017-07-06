/*
 * SOE_CHL_DATA_A (Client -> Server OR Server -> Client)
 * Standard packet with containing an swg packet
 *
 * sequence: UDP doesnt include acknowledgement as part of the protocol so
 *					this is a number to be acknowledged that it was received by the receiver.
 */

 var packetHelper = require('../packetHelper');
 var _ = require('lodash');
 var async = require('async');

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

					var swgPackets = [];
					var swgPacketBuffers = [];
					var swgPacket = {};
					var packetLength = 0;

					//multi-packet
					if(parsedSOEPacket.extraData.readUInt16LE(0) === 6400) {
						parsedSOEPacket.multi = true;
						parsedSOEPacket.extraData = parsedSOEPacket.extraData.slice(2);

						while(parsedSOEPacket.extraData.length > 0) {
							packetLength = parsedSOEPacket.extraData.readInt8(0);

							swgPacketBuffers.push(parsedSOEPacket.extraData.slice(1, packetLength+1));

							parsedSOEPacket.extraData = parsedSOEPacket.extraData.slice(packetLength+1);
						}

					} else {
						swgPacketBuffers.push(parsedSOEPacket.extraData);
					}

					async.each(swgPacketBuffers, function(buffer, callback) {
						//move this into swgPacket?
						var newPacket = {
							operandCount: buffer.readUInt16LE(0),
							opcode: buffer.readUInt32LE(2).toString('16')
						}

						if(!packetHelper.packets[newPacket.opcode]) {
							console.log('WARNING: UNKNOWN PACKET:', newPacket.opcode);
							return callback(null);
						}

						packetHelper.packets[newPacket.opcode].bufferToPacket({buffer: buffer.slice(6)}, function(err, parsedSWGPacket) {

							swgPackets.push(_.merge(newPacket, parsedSWGPacket));
							callback(err);
						});
					}, function(err) {

						parsedSOEPacket.swgPackets = swgPackets;
						delete parsedSOEPacket.extraData;
						callback(err, parsedSOEPacket);
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

		var packetBuffers = [parsedSOEBuffer];

		//multi packets need a multi packet identifier
		if(options.packet.swgPackets.length > 1) {
			packetBuffers.push(Buffer.from('0019', 'hex'));
		}

		async.each(options.packet.swgPackets, function(packet, callback) {

			var newOptions = _.clone(options);
			newOptions.packet = packet;

			packetHelper.packets[packet.opcode.toLowerCase()].packetToBuffer(newOptions, function(err, parsedSWGBuffer) {
				//multi packets have length of the packet before the packet data
				if(options.packet.swgPackets.length > 1) {
					packetBuffers.push(Buffer.from(_this._getHexInt(parsedSWGBuffer.length, 2), 'hex')); //length of each packet
				}

				packetBuffers.push(parsedSWGBuffer);
				callback();
			});

		}, function(err) {

			var buff = Buffer.concat(packetBuffers);

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