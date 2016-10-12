var crc = require('../crc');
var xor = require('../xor');
var defaults = require('../defaults');
var zlib = require('zlib');

var packet = exports = module.exports = {
	operands: []
}


packet.bufferToPacket = function(options, callback) {
	var parsedPacket = {};
	var bufferLength = Buffer.byteLength(options.buffer);
	var index = 0;

	if (this.operands) {
		this.operands.forEach(function(value) {
			if (index >= bufferLength) {
				console.log('WARNING: packet buffer length exceeded, skipping data.', index, '@', options.buffer);
				return;
			}

			if (value.type == 'byte') {
				parsedPacket[value.name] = options.buffer.readUInt8(index);
				index += 1;
			}
			if (value.type == 'short') {
				parsedPacket[value.name] = options.buffer.readUInt16BE(index);
				index += 2;
			} else if (value.type == 'int') {
				parsedPacket[value.name] = options.buffer.readUInt32BE(index);
				index += 4;
			} else if (value.type == 'long') {
				//does this need to be changed to read more bytes?
				parsedPacket[value.name] = options.buffer.readUInt32BE(index);
				index += 4;
			} else if (value.type == 'a_string') {
				dataLength = options.buffer.readUInt16LE(index);
				parsedPacket[value.name] = options.buffer.toString('ascii', index + 2, index + 2 + dataLength);
				index += dataLength + 2;
			} else if (value.type == 'b_string') {
				dataLength = options.buffer.readUInt32LE(index);
				parsedPacket[value.name] = options.buffer.toString('hex', index + 4, index + 4 + dataLength);
				index += dataLength + 4;
			}
		});
	}

	if (index < bufferLength) {
		parsedPacket.extraData = options.buffer.slice(index);
	}

	callback(null, parsedPacket);
}



packet.parseObjIntoPacket = function(packetObj) {
	var newPacket = {};

	this.operands.forEach(function(value) {
		if (packetObj[value.name]) {
			newPacket[value.name] = packetObj[value.name];
		}
	});

	return newPacket;
}



packet.packetToBuffer = function(options, callback) {
	var parsedHexStr = '';
	var packetObj = options.packet;
	var _this = this;

	if (this.operands) {
		this.operands.forEach(function(value) {

			if (value.type == 'byte') {
				parsedHexStr += _this._getHexInt(packetObj[value.name], 2);
			} else if (value.type == 'short') {
				parsedHexStr += _this._getHexInt(packetObj[value.name], 4);
			} else if (value.type == 'int') {
				parsedHexStr += _this._getHexInt(packetObj[value.name], 8);
			} else if (value.type == 'long') {
				//does this need to be changed to read more bytes?
				parsedHexStr += _this._getHexInt(packetObj[value.name], 8);
			} else if (value.type == 'a_string') {
				parsedHexStr += Buffer.from(_this._getHexInt(packetObj[value.name].length, 4), 'hex').swap16().toString('hex');
				parsedHexStr += Buffer.from(packetObj[value.name], 'ascii').toString('hex');
			} else if (value.type == 'b_string') {
				parsedHexStr += Buffer.from(_this._getHexInt(packetObj[value.name].length/2, 8), 'hex').swap32().toString('hex');
				parsedHexStr += packetObj[value.name];
			}
		});
	}

	callback(null, Buffer.from(parsedHexStr, 'hex'));
};


packet._getHexInt = function(value, size) {
	var newValue = '';
	size = size || 2;

	if (!value) {
		for (var i = 0; i < size; i++) newValue += '0';
		return newValue;
	}

	value = value.toString(16);

	while (value.length < size) {
		value = '0' + value;
	}

	return value;
};

packet._appendCRC = function(options, callback) {
	// return new Buffer(buffer.toString('hex') + crc(buffer), 'hex');
	var newCRC = crc(options.buffer, options.crcSeed).toString(16);

	var crcLow = newCRC[newCRC.length - 4] + newCRC[newCRC.length - 3];
	var crcHigh = newCRC[newCRC.length - 2] + newCRC[newCRC.length - 1];

	callback(null, Buffer.concat([options.buffer, Buffer.from(newCRC.substr(newCRC.length - 4), 'hex')]))
};


packet._checkAndRemoveCRC = function(options, callback) {
	var crcToRemove = options.buffer.slice(options.buffer.length - options.crcLength).toString('hex');

	var newBuffer = new Buffer(options.buffer.length - options.crcLength);
	options.buffer.copy(newBuffer, 0, 0, options.buffer.length - options.crcLength);

	var newCRC = crc(newBuffer, options.crcSeed).toString(16);

	var crcLow = newCRC[newCRC.length - 4] + newCRC[newCRC.length - 3];
	var crcHigh = newCRC[newCRC.length - 2] + newCRC[newCRC.length - 1];

	if (crcLow != (crcToRemove[0] + crcToRemove[1]) || crcHigh != (crcToRemove[2] + crcToRemove[3])) {
		return callback('CRC incorrect, ignoring packet', null);
	}

	return callback(null, newBuffer);
};


packet._encrypt = function(options, callback) {
	var bufferWithoutOpcode = new Buffer(options.buffer.length - 2);
	options.buffer.copy(bufferWithoutOpcode, 0, 2);

	var encryptedBuffer = xor.encrypt({
		buffer: bufferWithoutOpcode,
		crcSeed: options.crcSeed
	});

	var newBuffer = new Buffer(options.buffer.length);
	options.buffer.copy(newBuffer, 0, 0, 2); //add the opcode
	encryptedBuffer.copy(newBuffer, 2); //add the rest

	callback(null, newBuffer);
};

packet._decrypt = function(options, callback) {
	var bufferWithoutOpcode = new Buffer(options.buffer.length - 2);
	options.buffer.copy(bufferWithoutOpcode, 0, 2);

	var decryptedBuffer = xor.decrypt({
		buffer: bufferWithoutOpcode,
		crcSeed: options.crcSeed
	});

	var newBuffer = new Buffer(options.buffer.length);
	options.buffer.copy(newBuffer, 0, 0, 2); //add the opcode
	decryptedBuffer.copy(newBuffer, 2); //add the rest

	callback(null, newBuffer);
};




packet._deflateAndAddCompressionFlag = function(options, callback) {
	if (defaults.useCompression) {
		zlib.deflate(options.buffer.slice(2), function(err, deflatedBuffer) {
			if (err) {
				throw new Error('error in zlib.deflate');
			}
			var resBuff = Buffer.concat([options.buffer.slice(0, 2), deflatedBuffer, Buffer.from('01', 'hex')]);
			callback(null, resBuff);
		});
	} else {
		callback(null, Buffer.concat([options.buffer, Buffer.from('00', 'hex')]));
	}
};

packet._inflateAndRemoveCompressionFlag = function(options, callback) {
	var _this = this;
	var bufferWithoutOpcodeOrCompressionFlag = new Buffer(options.buffer.length - 3);
	options.buffer.copy(bufferWithoutOpcodeOrCompressionFlag, 0, 2, options.buffer.length - 1);

	if (options.buffer[options.buffer.length - 1] === 1) {
		zlib.inflate(bufferWithoutOpcodeOrCompressionFlag, function(err, inflatedBuffer) {
			if (err) {
				console.log(err);
				return callback('error in zlib.inflate');
			}
			callback(null, Buffer.concat([options.buffer.slice(0, 2), inflatedBuffer]));
		});
	} else {
		callback(null, Buffer.concat([options.buffer.slice(0, 2), bufferWithoutOpcodeOrCompressionFlag]));
	}
};