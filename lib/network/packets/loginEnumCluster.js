var packet = exports = module.exports = {
	name: 'LoginEnumCluster',
	opcode: 'C11C63B9',
	operandCount: 3,
	operands: [
		{
			name: 'ServerCount',
			type: 'int',
			child: {
				name: 'servers',
				type: 'array',
				operands: [
					{
						name: 'ServerID',
						type: 'int'
					},
					{
						name: 'ServerName',
						type: 'a_string'
					},
					{
						name: 'Distance',
						type: 'int'
					}
				]
			}
		},
		{
			name: 'MaxCharsPerAccount',
			type: 'int',
			endian: 'little'
		}
	]
};

Object.setPrototypeOf(packet, require('./swgPacket'));