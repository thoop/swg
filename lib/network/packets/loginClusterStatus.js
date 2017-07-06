var packet = exports = module.exports = {
	name: 'LoginClusterStatus',
	opcode: '3436AEB6',
	operandCount: 3, //saw a 3 in testing, but shouldn't this be 2?
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
						name: 'IP_ADDR',
						type: 'a_string'
					},
					{
						name: 'ServerPort',
						type: 'short'
					},
					{
						name: 'PingPort',
						type: 'short'
					},
					{
						name: 'ServerPopulation',
						type: 'int'
					},
					{
						name: 'MaxCapacity',
						type: 'int'
					},
					{
						name: 'MaxCharsPerServer',
						type: 'int'
					},
					{
						name: 'Distance',
						type: 'int'
					},
					{
						name: 'Status',
						type: 'int'
					},
					{
						name: 'NotRecommendedFlag',
						type: 'byte'
					}
				]
			}
		}
	]
};

Object.setPrototypeOf(packet, require('./swgPacket'));