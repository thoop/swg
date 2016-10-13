exports = module.exports = {
	crcSeed: 'a50a8e8a', //'AB8E92D4'

	//length of the CRC checksum to append at the end of a packet. SWG uses 2 bytes.
	crcLength: 2,
	useCompression: true,

	//Size in bytes for the XOR encryption key. Seed seems to have a max value of 5bytes. Standard is 4
	seedSize: 4, //not used right now
	shouldAcknowledgePackets: true,

	receiveBufferSize: 496,

	address: '127.0.0.1', //default address
	port: 44453 //default port
};