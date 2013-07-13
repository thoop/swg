var Router = require('./router')
  , dgram = require('dgram');

var app = exports = module.exports = {};

app.init = function(options) {
	this.options = options;
    var router = this._router = new Router(options);
    this.server = dgram.createSocket('udp4');
    this.server.on('message', function(buffer, requestInfo) {
        var server = this;
        var hex = buffer.toString('hex');
        var req = {
            hex: hex,
            res: res,
            requestInfo: requestInfo
        };
        var res = {
            req: req,
            send: function(response) {
                console.log('sending ' + response.toString('hex'));
                var buffer = new Buffer(response, 'hex');
                server.send(buffer, 0, buffer.length, requestInfo.port, requestInfo.address);
            }
        };

        router.middleware(req, res, function(){});
    });
};

app.listen = function(port, callback) {
    this.server.on('listening', callback);
    this.server.bind(44453);
};

app.on = function() {
	this._router.register.apply(this._router, arguments);
};




var decrypt = function(hex, crcSeed) {

    crcSeed = parseInt(crcSeed, 16); //get int of hex for bitwise operations
    data = hex.substring(4).substring(0, hex.length - 8); //ignore opcode and crc
    var length = data.length;

    var response = '', newHexValue, index, prevIndex;

    var block_count = Math.floor(length / 8);
    var byte_count = (length % 8 / 2); //divided by 2 since each hex number is 2 numbers

    // for(var i =0; i < length; i+=8) {
    //     prevIndex = i - 8;

    //     crcSeed = prevIndex < 0 ? crcSeed : parseInt(data.substring(prevIndex, prevIndex+8), 16);
    //     newHexValue = ((parseInt(data.substring(index, index+8), 16) ^ crcSeed)>>>0).toString(16); //>>>0 turns it into an unsigned int
    //     while (newHexValue.length < 8) {
    //         newHexValue = '0' + newHexValue;
    //     }
    //     response += newHexValue;
    // }

    for(var i = 0; i < block_count; i++) {
        index = i*8;
        prevIndex = (i-1)*8;

        if(i > 0) {
            crcSeed = parseInt(data.substring(prevIndex, prevIndex+8), 16);
        }

        newHexValue = ((parseInt(data.substring(index, index+8), 16) ^ crcSeed)>>>0).toString(16); //>>>0 turns it into an unsigned int
        while (newHexValue.length < 8) {
            newHexValue = '0' + newHexValue;
        }
        response += newHexValue;
    }

    crcSeed = parseInt(data.substring(data.length - byte_count*2 - 8, data.length - byte_count*2 - 6), 16); //get the first byte from the key
    for(var j = 0; j < byte_count; j++) {
        index = i*8+(j*2);

        newHexValue = ((parseInt(data.substring(index, index+2), 16) ^ crcSeed)>>>0).toString(16);
        if (newHexValue.length != 2) {
            newHexValue = '0' + newHexValue;
        }
        response += newHexValue;
    }

    response = hex.substring(0,4) + response + hex.substring(hex.length - 4);
    return response.toUpperCase();
};

var encrypt = function(hex, crcSeed) {

    crcSeed = parseInt(crcSeed, 16); //get int of hex for bitwise operations
    data = hex.substring(4).substring(0, hex.length - 8); //ignore opcode and crc
    var length = data.length;

    var response = '', newHexValue, index, prevIndex;

    var block_count = Math.floor(length / 8);
    var byte_count = (length % 8 / 2); //divided by 2 since each hex number is 2 numbers

    for(var i = 0; i < block_count; i++) {
        index = i*8;

        crcSeed = (parseInt(data.substring(index, index+8), 16) ^ crcSeed)>>>0; //>>>0 turns it into an unsigned int
        newHexValue =  crcSeed.toString(16);
        while (newHexValue.length < 8) {
            newHexValue = '0' + newHexValue;
        }
        response += newHexValue;
    }

    crcSeed = parseInt(crcSeed.toString(16).substring(0,2), 16); //get the first byte from the key
    for(var j = 0; j < byte_count; j++) {
        index = i*8+(j*2);

        newHexValue= ((parseInt(data.substring(index, index+2), 16) ^ crcSeed)>>>0).toString(16);
        if (newHexValue.length != 2) {
            newHexValue = '0' + newHexValue;
        }
        response += newHexValue;
    }

    response = hex.substring(0,4) + response + hex.substring(hex.length - 4);
    return response.toUpperCase();
};