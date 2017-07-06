var packet = exports = module.exports = {
	name: 'EnumerateCharacterId',
	opcode: '65EA4574',
	operandCount: 2,
	operands: [
		{
			name: 'CharacterCount',
			type: 'int',
			child: {
				name: 'characters',
				type: 'array',
				operands: [
					{
						name: 'NameString',
						type: 'u_string'
					},
					{
						name: 'RaceGenderCRC',
						type: 'int'
					},
					{
						name: 'CharacterID',
						type: 'long'
					},
					{
						name: 'ServerID',
						type: 'int'
					},
					{
						name: 'Status',
						type: 'int'
					}
				]
			}
		}
	]
};

Object.setPrototypeOf(packet, require('./swgPacket'));