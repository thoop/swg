/*
 * SOE_DISCONNECT (Client -> Server)
 * Sent from the client when a user has disconnected.
 *
 * connectionId: Identification originally sent from the client.
 * reasonId: The reason for the disconnect.
 */

var packet = exports = module.exports = {
	name: 'soe_disconnect',
	opcode: '0005',
	operands: [
		{
			name: 'connectionId',
			type: 'int'
		},
		{
			name: 'reasonId',
			type: 'short'
		}
	]
};

Object.setPrototypeOf(packet, require('./soePacket'));