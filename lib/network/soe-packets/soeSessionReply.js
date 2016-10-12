/*
 * SOE_SESSION_REPLY (Server -> Client)
 * Sent from the server to acknowledge creation of a session.
 *
 * connectionId: Identification originally sent from the client.
 * crcSeed: Seed value used for the calculation of the crc32 checksum.
 * crcLength: The length of the crc appended to the end of the packet. default: 2
 * useCompression: Whether compression is turned on or off. 01 vs 00
 * seedSize: Size in bytes for the xor encryption key. default: 4
 * serverUDPSize: Maximum size allocated for server's UDP packet buffer.
 *								No packet is allowed to exceed this size.
 *								If the packet is larger, it must be fragmented.
 */

var packet = exports = module.exports = {
	name: 'soe_session_reply',
	opcode: '0002',
	operands: [
		{
			name: 'connectionId',
			type: 'int'
		},
		{
			name: 'crcSeed',
			type: 'int'
		},
		{
			name: 'crcLength',
			type: 'byte'
		},
		{
			name: 'useCompression',
			type: 'byte'
		},
		{
			name: 'seedSize',
			type: 'byte'
		},
		{
			name: 'serverUDPSize',
			type: 'int'
		}
	]
};

Object.setPrototypeOf(packet, require('./soePacket'));