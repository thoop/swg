/*
 * SOE_OUT_ORDER_PKT_A (Client -> Server OR Server -> Client)
 * Packet containing the sequence number of an out of order packet received.
 *
 * sequence: In this case, sequence number is the sequence of the out
 *						of order packet received.
 */

var packet = exports = module.exports = {
	name: 'soe_out_order_pkt_a',
	opcode: '0011',
	operands: [
		{
			name: 'sequence',
			type: 'short'
		}
	]
};

Object.setPrototypeOf(packet, require('./soePacket'));