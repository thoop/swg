/*
 * SOE_DATA_FRAG_A (Client -> Server OR Server -> Client)
 * Packet containing a piece of a packet that exceeds the packet buffer size.
 * Fragments are made when the total uncompressed packet exceeds the allowed buffer size.
 *
 * sequence: UDP doesnt include acknowledgement as part of the protocol so
 *					this is a number to be acknowledged that it was received by the receiver.
 * fragmentSize: this only appears on the first packet of a group of fragmented packets
 */

var packet = exports = module.exports = {
	name: 'soe_data_frag_a',
	opcode: '000D',
	operands: [
		{
			name: 'sequence',
			type: 'short'
		},
		{
			name: 'fragmentSize',
			type: 'int'
		}
	]
};

Object.setPrototypeOf(packet, require('./soePacket'));