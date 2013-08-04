var Router = require('./router')
  , zlib = require('zlib')
  , dgram = require('dgram')
  , xor = require('./xor')
  , crc = require('./crc')
  , defaults = require('./defaults');

exports = module.exports = app;

function app(options) {
    var _this = this;
	this.options = options;
    var router = this._router = new Router(options);
    this.server = dgram.createSocket('udp4');

    this.server.on('message', function(buffer, requestInfo) {
        var server = this;

        if (_this.options.verbose) {
            console.log('Received ' + buffer.toString('hex') + ' from ' + requestInfo.address + ':' + requestInfo.port);
        }

        _this.parsePacket(buffer, function(packet) {

            if (packet.sequence && defaults.shouldAcknowledgePackets) {
                _this.send('0015' + packet.sequence, requestInfo.port, requestInfo.address);
            }

            var req = {
                packet: packet,
                res: res,
                requestInfo: requestInfo
            };
            var res = {
                req: req,
                send: function(response) {
                    _this.send(response, requestInfo.port, requestInfo.address);
                }
            };

            router.middleware(req, res, function(){});
        });
    });
};

app.prototype.setDefault = function(key, value) {
    defaults[key] = value;
};

app.prototype.listen = function(port, callback) {
    this.server.on('listening', callback);
    this.server.bind(44453);
};

app.prototype.on = function() {
	this._router.register.apply(this._router, arguments);
};

app.prototype.deflate = function(buffer, callback) {
    if (defaults.useCompression) {
        zlib.deflate(buffer.slice(2), function(err, deflatedBuffer) {
            if (err) {
                throw new Error('error in zlib.deflate');
            }
            var resBuff = Buffer.concat([buffer.slice(0,2), deflatedBuffer , new Buffer('01')]);
            callback.call(app, resBuff);
        });
    } else {
        callback.call(this, new Buffer(buffer.toString('hex') + '00', 'hex'));
    }
};

app.prototype.inflate = function(buffer, callback) {
    if (defaults.useCompression) {
        zlib.inflate(buffer.slice(2), function(err, inflatedBuffer) {
            if (err) {
                console.log(err);
                throw new Error('error in zlib.inflate');
            }
            callback.call(app, Buffer.concat([buffer.slice(0,2), inflatedBuffer]));
        });        
    } else {
        callback.call(this, buffer);
    }
};

app.prototype.send = function(response, port, address) {
    var buffer = new Buffer(response, 'hex');
    var _this = this;

    if (this.options.verbose) {
        console.log('sending ' + response.toString('hex'));    
    }

    if (response.substring(0,4) === '0001' || response.substring(0,4) === '0002') {
        this.server.send(buffer, 0, buffer.length, port, address);
    } else {

        this.deflate(buffer, function(buffer) {
            console.log('deflated:' + buffer.toString('hex'));
            buffer = _this.encrypt(buffer);
            console.log('encrypted:' + buffer.toString('hex'));
            buffer = _this.appendCRC(buffer);
            console.log('crced:' + buffer.toString('hex'));

            _this.server.send(buffer, 0, buffer.length, port, address);
        });
    }
};



app.prototype.parsePacket = function(buffer, callback) {
    var soeOpcode = buffer.slice(0, 2).toString('hex');

    if(soeOpcode == '0001') {
        var crcLength = buffer.slice(2,6).toString('hex');
        var connectionId = buffer.slice(6,10).toString('hex');
        var clientUDPSize = buffer.slice(10,14).toString('hex');

        callback({
            soeOpcode: soeOpcode,
            crcLength: crcLength,
            connectionId: connectionId,
            crcSeed: defaults.crcSeed,
            clientUDPSize: clientUDPSize
        });

    } else if (soeOpcode == '0002') {
        var connectionId = buffer.slice(2, 6).toString('hex');
        var crcSeed = buffer.slice(6, 10).toString('hex');
        var crcLength = buffer.slice(10, 11).toString('hex');
        var useCompression = buffer.slice(11, 12).toString('hex');
        var seedSize = buffer.slice(12, 13).toString('hex');
        var serverUDPSize = buffer.slice(13, 17).toString('hex');

        callback({
            soeOpcode: soeOpcode,
            connectionId: connectionId,
            crcSeed: crcSeed,
            crcLength: crcLength,
            useCompression: useCompression,
            seedSize: seedSize,
            serverUDPSize: serverUDPSize
        });
    } else if (soeOpcode == '0009') {
        try {
            buffer = this.checkAndRemoveCRC(buffer);
        } catch (err) {
            if (this.options.verbose) {
                console.log('crc incorrect. ignoring packet');
            }
            return;
        }
        console.log('removed crc:' + buffer.toString('hex'));
        buffer = this.decrypt(buffer);
        console.log('decrypted:' + buffer.toString('hex'));

        this.inflate(buffer, function(buffer) {
            hex = buffer.toString('hex');
            console.log('got ' + hex);

            var sequence = buffer.slice(2, 4).toString('hex');

            var operandCount = buffer.readUInt16LE(4);

            var opcode = buffer.readUInt32LE(6).toString('16');

            var dataBuffer = buffer.slice(10);

            var data = []
              , dataLength = 0
              , index = 0;


            while(index < dataBuffer.length) {
                dataLength = dataBuffer.readUInt16LE(index);
                data.push(dataBuffer.toString('utf8', index + 2, index + 2 + dataLength));
                index += dataLength + 2;
            }

            callback({
                soeOpcode: soeOpcode,
                sequence: sequence,
                operandCount: operandCount,
                opcode: opcode,
                data: data
            });
        });

    } else if (soeOpcode == '0015') {
        var sequence = buffer.slice(2, 4).toString('hex');

        callback({
            soeOpcode: soeOpcode,
            sequence: sequence
        });
    } else {
        callback({
            soeOpcode: soeOpcode
        });
    }
};

app.prototype.decrypt = function(buffer, crcSeed) {
    //remove opcode and pass buffer in to decrypt
    var bufferWithoutOpcode = new Buffer(buffer.length - 2);
    buffer.copy(bufferWithoutOpcode, 0, 2);

    var decryptedBuffer = xor.decrypt({
        buffer: bufferWithoutOpcode,
        crcSeed: crcSeed
    });

    var newBuffer = new Buffer(buffer.length);
    buffer.copy(newBuffer, 0, 0, 2); //add the opcode
    decryptedBuffer.copy(newBuffer, 2); //add the rest

    return newBuffer;
};

app.prototype.encrypt = function(buffer, crcSeed) {
    //remove opcode and pass buffer in to encrypt
    var bufferWithoutOpcode = new Buffer(buffer.length - 2);
    buffer.copy(bufferWithoutOpcode, 0, 2);

    var encryptedBuffer = xor.encrypt({
        buffer: bufferWithoutOpcode,
        crcSeed: crcSeed
    });

    var newBuffer = new Buffer(buffer.length);
    buffer.copy(newBuffer, 0, 0, 2); //add the opcode
    encryptedBuffer.copy(newBuffer, 2); //add the rest

    return newBuffer;
};

var getCRC = function(buffer) {
    var value = crc(buffer);
    value = (value>>>0).toString(16);
    return value.substring(value.length - (defaults.crcLength * 2))
};

app.prototype.appendCRC = function(buffer) {
    return new Buffer(buffer.toString('hex') + getCRC(buffer), 'hex');
};

app.prototype.checkAndRemoveCRC = function(buffer) {
    var crcToRemove = buffer.slice(buffer.length - defaults.crcLength).toString('hex');

    //removing the crc
    var newBuffer = new Buffer(buffer.length - defaults.crcLength);
    buffer.copy(newBuffer, 0, 0, buffer.length - defaults.crcLength);

    var newCRC = getCRC(newBuffer);
    if(newCRC !== crcToRemove) {
        throw new Error('CRC incorrect. Expected ' + newCRC + ' but got ' + crcToRemove);
    }

    return newBuffer;
};

