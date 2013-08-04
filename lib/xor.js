var defaults = require('./defaults');

exports = module.exports = {
	encrypt: encrypt,
	decrypt: decrypt
};

var copyBuffer = function(buffer) {
	newBuffer = new Buffer(buffer.length);
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

	var crcSeed = options.crcSeed ? parseInt(options.crcSeed, 16) : parseInt(defaults.crcSeed, 16)
	  , data = copyBuffer(options.buffer)
	  , length = data.length
	  , response = ''
	  , newHexValue = ''
	  , block_count = Math.floor(length / 4)
	  , byte_count = (length % 4)
	  , i = 0
	  , j = 0;

	//xor each block
	for(i = 0; i < block_count; i++) {

	    crcSeed = (data.readUInt32BE(i*4) ^ crcSeed)>>>0; //>>>0 turns it into an unsigned int
	    response += ('00000000' + crcSeed.toString(16)).substr(-8); //makes sure there are leading 0's on the hex value
	}

	//xor the remainder
	crcSeed = parseInt(('00000000' + crcSeed.toString(16)).substr(-8).substring(0,2), 16); //get the first byte from the key
	for(j = 0; j < byte_count; j++) {

	    newHexValue= ((data.readInt8(i*4+j) ^ crcSeed)>>>0).toString(16);
	    response += ('00' + newHexValue).substr(-2); //makes sure there are leading 0's on the hex value
	}

	return new Buffer(response, 'hex');
}


/**
 * XOR decryption based on http://wiki.swganh.org/index.php/SWG_Packet_Encryption
 * options can pass in:
 * buffer to encrypt
 * crcSeed if not using default
 */
function decrypt(options) {
	if (!options.buffer) throw new Error('must pass in a buffer to decrypt');

    var crcSeed = options.crcSeed ? parseInt(options.crcSeed, 16) : parseInt(defaults.crcSeed, 16)
      , data = copyBuffer(options.buffer)
      , length = data.length
      , response = ''
      , newHexValue = ''
      , prevIndex = 0
	  , block_count = Math.floor(length / 4)
	  , byte_count = (length % 4)
	  , i = 0
	  , j = 0;

	//xor each block
    for(i = 0; i < block_count; i++) {
        prevIndex = (i-1)*4;

        if(i > 0) {
            crcSeed = data.readUInt32BE(prevIndex);
        }

        newHexValue = ((data.readUInt32BE(i*4) ^ crcSeed)>>>0).toString(16); //>>>0 turns it into an unsigned int
        response += ('00000000' + newHexValue).substr(-8); //makes sure there are leading 0's on the hex value
    }
    
	//xor the remainder
    crcSeed = parseInt(data.slice(data.length - byte_count - 4, data.length - byte_count - 4 + 1).toString('hex'), 16);
    for(j = 0; j < byte_count; j++) {
        index = i*4+j;

        newHexValue = ((data.readInt8(index) ^ crcSeed)>>>0).toString(16);
        response += ('00' + newHexValue).substr(-2); //makes sure there are leading 0's on the hex value
    }

    return new Buffer(response, 'hex');
}