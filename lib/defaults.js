exports = module.exports = {
	crcSeed: 'a50a8e8a', //'AB8E92D4'

	//length of the CRC checksum to append at the end of a packet. SWG uses 2 bytes.
	crcLength: 2,
	useCompression: false,

	//Size in bytes for the XOR encryption key. Seed seems to have a max value of 5bytes. Standard is 4
	seedSize: 4, //not used right now
	shouldAcknowledgePackets: false, //only the server needs to ack packets

	address: '127.0.0.1', //default address
	port: 44453 //default port
};