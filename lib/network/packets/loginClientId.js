var packet = exports = module.exports = {
	name: 'LoginClientId',
	opcode: '41131F96',
	operandCount: 4,
	operands: [
		{
			name: 'username',
			type: 'a_string'
		},
		{
			name: 'password',
			type: 'a_string'
		},
		{
			name: 'version',
			type: 'a_string'
		}
	]
};

Object.setPrototypeOf(packet, require('./swgPacket'));