/*
 * SOE_NET_STATUS_RES (Server -> Client)
 * Sent from the server with network statistics for the client.
 *
 */

var packet = exports = module.exports = {
	name: 'soe_net_status_res',
	opcode: '0008',
	operands: [
		{
			name: 'clientTickCount',
			type: 'short'
		},
		{
			name: 'serverTickCount',
			type: 'int'
		},
		{
			name: 'clientPacketsSent',
			type: 'long'
		},
		{
			name: 'clientPacketsReceived',
			type: 'long'
		},
		{
			name: 'serverPacketsSent',
			type: 'long'
		},
		{
			name: 'serverPacketsReceived',
			type: 'long'
		}
	]
};

Object.setPrototypeOf(packet, require('./soePacket'));