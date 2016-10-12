/*
 * SOE_SESSION_REQUEST (Client -> Server)
 * Sent by the client to initiate the first connection to the server.
 *
 * crcLength: The length of the crc appended to the end of the packet. default: 2
 * connectionId: Identification from the client.
 * clientUDPSize: Maximum size allocated for client's UDP packet buffer.
 *								No packet is allowed to exceed this size.
 *								If the packet is larger, it must be fragmented.
 */

var packet = exports = module.exports = {
	name: 'soe_session_request',
	opcode: '0001',
	operands: [
		{
			name: 'crcLength',
			type: 'int'
		},
		{
			name: 'connectionId',
			type: 'int'
		},
		{
			name: 'clientUDPSize',
			type: 'int'
		}
	]
};

Object.setPrototypeOf(packet, require('./soePacket'));