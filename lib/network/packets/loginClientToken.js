var packet = exports = module.exports = {
	name: 'LoginClientToken',
	opcode: 'AAB296C6',
	operandCount: 4,
	operands: [
		{
			name: 'sessionKey',
			type: 'b_string'
		},
		{
			name: 'userId',
			type: 'int'
		},
		{
			name: 'userName',
			type: 'a_string'
		}
	]
};

Object.setPrototypeOf(packet, require('./swgPacket'));