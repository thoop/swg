var defaults = require('./defaults');
var Buffer = require('safe-buffer').Buffer;

exports = module.exports = {
	encrypt: encrypt,
	decrypt: decrypt
};

var copyBuffer = function(buffer) {
	newBuffer = Buffer.allocUnsafe(buffer.length);
	buffer.copy(newBuffer);
	return newBuffer;
};

/**
 * XOR encryption based on http://wiki.swganh.org/index.php/SWG_Packet_Encryption
 * options can pass in:
 * buffer to encrypt
 * crcSeed if not using default
 */
function encrypt(options) {
	if (!options.buffer) throw new Error('must pass in a buffer to encrypt');

	var crcSeed = options.crcSeed ? options.crcSeed : defaults.crcSeed;
	var data = copyBuffer(options.buffer);
	var length = data.length;
	var response = '';
	var newHexValue = '';
	var block_count = Math.floor(length / 4);
	var byte_count = (length % 4);
	var i = 0;
	var j = 0;

	//swap endian-ness of crcSeed. I have no idea why this is necessary but it works? Eww
	crcSeed = ((crcSeed & 0xFF) << 24) | ((crcSeed & 0xFF00) << 8) | ((crcSeed >> 8) & 0xFF00) | ((crcSeed >> 24) & 0xFF);

	//xor each block
	for (i = 0; i < block_count; i++) {
		crcSeed = (data.readUInt32BE(i * 4) ^ crcSeed) >>> 0; //>>>0 turns it into an unsigned int
		response += ('00000000' + crcSeed.toString(16)).substr(-8); //makes sure there are leading 0's on the hex value
	}
	//xor the remainder
	crcSeed = parseInt(('00000000' + crcSeed.toString(16)).substr(-8).substring(0, 2), 16); //get the first byte from the key

	for (j = 0; j < byte_count; j++) {
		newHexValue = ((data.readInt8(i * 4 + j) ^ crcSeed) >>> 0).toString(16);
		response += ('00' + newHexValue).substr(-2); //makes sure there are leading 0's on the hex value
	}

	return Buffer.from(response, 'hex');
}


/**
 * XOR decryption based on http://wiki.swganh.org/index.php/SWG_Packet_Encryption
 * options can pass in:
 * buffer to encrypt
 * crcSeed if not using default
 */
function decrypt(options) {
	if (!options.buffer) throw new Error('must pass in a buffer to decrypt');

	var crcSeed = options.crcSeed ? options.crcSeed : defaults.crcSeed;
	var ogSeed = crcSeed;
	var data = copyBuffer(options.buffer);
	var length = data.length;
	var response = '';
	var newHexValue = '';
	var prevIndex = 0;
	var tempSeed = 0;
	var block_count = Math.floor(length / 4);
	var byte_count = (length % 4);
	var i = 0;
	var j = 0;

	//swap endian-ness of crcSeed. I think we are reading BE but should be reading LE to get rid of this?
	crcSeed = ((crcSeed & 0xFF) << 24) | ((crcSeed & 0xFF00) << 8) | ((crcSeed >> 8) & 0xFF00) | ((crcSeed >> 24) & 0xFF);

	//xor each block
	for (i = 0; i < block_count; i++) {
		tempSeed = data.readUInt32BE(i * 4);

		newHexValue = ((data.readUInt32BE(i * 4) ^ crcSeed) >>> 0).toString(16); //>>>0 turns it into an unsigned int
		response += ('00000000' + newHexValue).substr(-8); //makes sure there are leading 0's on the hex value
		crcSeed = tempSeed;
	}

	index = data.length - byte_count - 4;
	if(index >= 0) {
		crcSeed = data.readUInt16LE(index);
	} else {
		crcSeed = ogSeed;
	}

	//xor the remainder
	for (j = 0; j < byte_count; j++) {
		index = i * 4 + j;

		newHexValue = ((data.readInt8(index) ^ crcSeed) >>> 0).toString(16);
		response += ('00' + newHexValue).substr(-2); //makes sure there are leading 0's on the hex value
	}

	return Buffer.from(response, 'hex');
}
