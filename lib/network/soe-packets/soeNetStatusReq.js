/*
 * SOE_NET_STATUS_REQ (Client -> Server)
 * Sent from the client with network statistics for the server.
 *
 */

var packet = exports = module.exports = {
	name: 'soe_net_status_req',
	opcode: '0007',
	operands: [
		{
			name: 'clientTickCount',
			type: 'short'
		},
		{
			name: 'lastUpdate',
			type: 'int'
		},
		{
			name: 'averageUpdate',
			type: 'int'
		},
		{
			name: 'shortestUpdate',
			type: 'int'
		},
		{
			name: 'longestUpdate',
			type: 'int'
		},
		{
			name: 'lastServerUpdate',
			type: 'int'
		},
		{
			name: 'packetsSent',
			type: 'long'
		},
		{
			name: 'packetsReceived',
			type: 'long'
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

Object.setPrototypeOf(packet, require('./soePacket'));