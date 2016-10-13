/*
 * SOE_ACK_A (Client -> Server OR Server -> Client)
 * Packet to acknowledge to the sender that a packet was received correctly.
 * An acknowledgement of a sequence number causes all sequence numbers less than
 * that sequence number to be considered acknowledged.
 *
 * sequence: In this case, sequence number is the sequence of the packet
 *						that was received by the receiver.
 */

var packet = exports = module.exports = {
	name: 'soe_ack_a',
	opcode: '0015',
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

					callback(err, parsedSOEPacket);
				}]);
			});
		});
	});
}




packet.packetToBuffer = function(options, callback) {
	var _this = this;

	Object.getPrototypeOf(packet).packetToBuffer.apply(this, [options, function(err, parsedSOEBuffer) {
		if(err) return callback(err, null);

		_this._deflateAndAddCompressionFlag({
			buffer: parsedSOEBuffer,
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
	}]);
}

Object.setPrototypeOf(packet, require('./soePacket'));