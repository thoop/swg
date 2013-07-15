var Router = require('./router')
  , zlib = require('zlib')
  , dgram = require('dgram');

var app = exports = module.exports = {};

app.crcSeed = 'a50a8e8a';//'AB8E92D4';
//length of the CRC checksum to append at the end of a packet. SWG uses 2 bytes.
app.crcLength = 2;
app.useCompression = false;
//Size in bytes for the XOR encryption key. Seed seems to have a max value of 5bytes. Standard is 4
app.seedSize = 4; //not used right now

app.init = function(options) {
	this.options = options;
    var router = this._router = new Router(options);
    this.server = dgram.createSocket('udp4');

    this.server.on('message', function(buffer, requestInfo) {
        var server = this;
        var hex = buffer.toString('hex');

        if (app.options.verbose) {
            console.log('Received ' + hex + ' from ' + requestInfo.address + ':' + requestInfo.port);
        }

        app._parsePacket(hex, function(packet) {

            if (packet.sequence) {
                app.send('0015' + packet.sequence, requestInfo.port, requestInfo.address);
            }

            var req = {
                hex: hex,
                packet: packet,
                res: res,
                requestInfo: requestInfo
            };
            var res = {
                req: req,
                send: function(response) {
                    app.send(response, requestInfo.port, requestInfo.address);
                }
            };

            router.middleware(req, res, function(){});
        });
    });
};

app.listen = function(port, callback) {
    this.server.on('listening', callback);
    this.server.bind(44453);
};

app.on = function() {
	this._router.register.apply(this._router, arguments);
};

app._deflate = function(response, callback) {
    if (this.useCompression) {
        zlib.deflate(response.substring(4), function(err, buffer) {
            if (err) {
                throw new Error('error in zlib.deflate');
            }
            var res = response.substring(0,4) + buffer.toString('hex') + '01';
            callback.call(app, res);
        });
    } else {
        callback.call(this, response + '00');
    }
};

app.send = function(response, port, address) {
    if (this.options.verbose) {
        console.log('sending ' + response.toString('hex'));    
    }

    if (response.substring(0,4) === '0001' || response.substring(0,4) === '0002') {
        var buffer = new Buffer(response, 'hex');
        this.server.send(buffer, 0, buffer.length, port, address);
    } else {
        this._deflate(response, function(hex) {
            console.log('deflated:' + hex);
            hex = this._encrypt(hex, 'a50a8e8a');
            console.log('encrypted:' + hex);
            hex = this._appendCRC(hex);
            console.log('crced:' + hex);

            var buffer = new Buffer(hex, 'hex');
            this.server.send(buffer, 0, buffer.length, port, address);
        });
    }
};



app._parsePacket = function(hex, callback) {
    var soeOpcode = hex.substring(0, 4);

    if(soeOpcode == '0001') {
        var crcLength = hex.substring(4,12);
        var connectionId = hex.substring(12,20);
        var clientUDPSize = hex.substring(20,28);

        callback({
            soeOpcode: soeOpcode,
            crcLength: crcLength,
            connectionId: connectionId,
            crcSeed: this.crcSeed,
            clientUDPSize: clientUDPSize
        });

    } else if (soeOpcode == '0002') {
        var connectionId = hex.substring(4, 12);
        var crcSeed = hex.substring(12, 20);
        var crcLength = hex.substring(20, 22);
        var useCompression = hex.substring(22, 24);
        var seedSize = hex.substring(24, 26);
        var serverUDPSize = hex.substring(26, 34);

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
        // this._checkCRC(hex);
        hex = this._decrypt(hex);
        console.log('decrypted:' + hex);
        zlib.inflate(hex, function(err, buffer) {
            if (err) {
                console.log(err);
                throw new Error('error in zlib.inflate');
            }

            hex = buffer.toString(16);
            console.log('got ' + hex);

            var sequence = hex.substring(4, 8);

            var operandCount = this._convertHostByteToNetworkByteOrder(hex.substring(8, 12));

            var opcode = this._convertHostByteToNetworkByteOrder(hex.substring(12, 20));

            var dataHex = hex.substring(20, hex.length - 6);

            var data = []
              , dataLength = 0;

            while(dataHex.length > 0) {
                dataLength = parseInt(this._convertHostByteToNetworkByteOrder(dataHex.substring(0, 4)), 16);
                data.push(this._hex2ascii(dataHex.substring(4, dataLength*2+4)));
                dataHex = dataHex.substring(dataLength*2+4);
            }

            callback({
                soeOpcode: soeOpcode,
                sequence: sequence,
                operandCount: operandCount,
                opcode: opcode,
                data: data
            });
        });
    } else {
        callback({});
    }
};

app._hex2ascii = function(hex) {
    var str = '';
    for (var i = 0; i < hex.length; i += 2)
        str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
    return str;
};

//switch all numbers around 961F1341 == 41131F96
app._convertHostByteToNetworkByteOrder = function(hex) {
    var newHex = '';

    for(var i = hex.length-1; i > 0; i-=2) {
        newHex += hex[i-1];
        newHex += hex[i];
    }

    return newHex;
};

app._decrypt = function(hex) {

    var crcSeed = parseInt(this.crcSeed, 16); //get int of hex for bitwise operations
    data = hex.substring(4); //ignore opcode
    data = data.substring(0, data.length - (this.crcLength * 2)); //ignore crc
    console.log('decrypting:'+data);
    var length = data.length;

    var response = '', newHexValue, index, prevIndex;

    var block_count = Math.floor(length / 8);
    var byte_count = (length % 8 / 2); //divided by 2 since each hex number is 2 numbers

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

    response = hex.substring(0,4) + response;
    return response;
};

app._encrypt = function(hex) {

    var crcSeed = parseInt(this.crcSeed, 16); //get int of hex for bitwise operations
    data = hex.substring(4); //ignore opcode
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

    response = hex.substring(0,4) + response;
    return response;
};

app._appendCRC = function(data) {
    var crc = app._swgcrc(data);
    crc = (crc>>>0).toString(16);
    return data + crc.substring(crc.length - (this.crcLength * 2));
};

app._swgcrc = function(str) {
    var table = ["00000000","77073096","EE0E612C","990951BA","076DC419","706AF48F","E963A535","9E6495A3","0EDB8832","79DCB8A4","E0D5E91E","97D2D988","09B64C2B","7EB17CBD","E7B82D07","90BF1D91","1DB71064","6AB020F2","F3B97148","84BE41DE","1ADAD47D","6DDDE4EB","F4D4B551","83D385C7","136C9856","646BA8C0","FD62F97A","8A65C9EC","14015C4F","63066CD9","FA0F3D63","8D080DF5","3B6E20C8","4C69105E","D56041E4","A2677172","3C03E4D1","4B04D447","D20D85FD","A50AB56B","35B5A8FA","42B2986C","DBBBC9D6","ACBCF940","32D86CE3","45DF5C75","DCD60DCF","ABD13D59","26D930AC","51DE003A","C8D75180","BFD06116","21B4F4B5","56B3C423","CFBA9599","B8BDA50F","2802B89E","5F058808","C60CD9B2","B10BE924","2F6F7C87","58684C11","C1611DAB","B6662D3D","76DC4190","01DB7106","98D220BC","EFD5102A","71B18589","06B6B51F","9FBFE4A5","E8B8D433","7807C9A2","0F00F934","9609A88E","E10E9818","7F6A0DBB","086D3D2D","91646C97","E6635C01","6B6B51F4","1C6C6162","856530D8","F262004E","6C0695ED","1B01A57B","8208F4C1","F50FC457","65B0D9C6","12B7E950","8BBEB8EA","FCB9887C","62DD1DDF","15DA2D49","8CD37CF3","FBD44C65","4DB26158","3AB551CE","A3BC0074","D4BB30E2","4ADFA541","3DD895D7","A4D1C46D","D3D6F4FB","4369E96A","346ED9FC","AD678846","DA60B8D0","44042D73","33031DE5","AA0A4C5F","DD0D7CC9","5005713C","270241AA","BE0B1010","C90C2086","5768B525","206F85B3","B966D409","CE61E49F","5EDEF90E","29D9C998","B0D09822","C7D7A8B4","59B33D17","2EB40D81","B7BD5C3B","C0BA6CAD","EDB88320","9ABFB3B6","03B6E20C","74B1D29A","EAD54739","9DD277AF","04DB2615","73DC1683","E3630B12","94643B84","0D6D6A3E","7A6A5AA8","E40ECF0B","9309FF9D","0A00AE27","7D079EB1","F00F9344","8708A3D2","1E01F268","6906C2FE","F762575D","806567CB","196C3671","6E6B06E7","FED41B76","89D32BE0","10DA7A5A","67DD4ACC","F9B9DF6F","8EBEEFF9","17B7BE43","60B08ED5","D6D6A3E8","A1D1937E","38D8C2C4","4FDFF252","D1BB67F1","A6BC5767","3FB506DD","48B2364B","D80D2BDA","AF0A1B4C","36034AF6","41047A60","DF60EFC3","A867DF55","316E8EEF","4669BE79","CB61B38C","BC66831A","256FD2A0","5268E236","CC0C7795","BB0B4703","220216B9","5505262F","C5BA3BBE","B2BD0B28","2BB45A92","5CB36A04","C2D7FFA7","B5D0CF31","2CD99E8B","5BDEAE1D","9B64C2B0","EC63F226","756AA39C","026D930A","9C0906A9","EB0E363F","72076785","05005713","95BF4A82","E2B87A14","7BB12BAE","0CB61B38","92D28E9B","E5D5BE0D","7CDCEFB7","0BDBDF21","86D3D2D4","F1D4E242","68DDB3F8","1FDA836E","81BE16CD","F6B9265B","6FB077E1","18B74777","88085AE6","FF0F6A70","66063BCA","11010B5C","8F659EFF","F862AE69","616BFFD3","166CCF45","A00AE278","D70DD2EE","4E048354","3903B3C2","A7672661","D06016F7","4969474D","3E6E77DB","AED16A4A","D9D65ADC","40DF0B66","37D83BF0","A9BCAE53","DEBB9EC5","47B2CF7F","30B5FFE9","BDBDF21C","CABAC28A","53B39330","24B4A3A6","BAD03605","CDD70693","54DE5729","23D967BF","B3667A2E","C4614AB8","5D681B02","2A6F2B94","B40BBE37","C30C8EA1","5A05DF1B","2D02EF8D"]
      , crcSeed = this.crcSeed
      , newCrc = 0
      , index = 0;

      newCrc = '0x' + table[ (~crcSeed) & 0xFF ];
      newCrc ^= 0x00FFFFFF;

      index = (crcSeed >> 8) ^ newCrc;
      newCrc = (newCrc >> 8) & 0x00FFFFFF;
      newCrc ^= '0x' + table[index & 0xFF];

      index = (crcSeed >> 16) ^ newCrc;
      newCrc = (newCrc >> 8) & 0x00FFFFFF;
      newCrc ^= '0x' + table[index & 0xFF];

      index = (crcSeed >> 24) ^ newCrc;
      newCrc = (newCrc >> 8) & 0x00FFFFFF;
      newCrc ^= '0x' + table[index & 0xFF];

      for(var i = 0; i < str.length; i++) {
        index = str.charCodeAt(i) ^ newCrc;
        newCrc = (newCrc >> 8) & 0x00FFFFFF;
        newCrc ^= '0x' + table[index & 0xFF];
      }

      return ~newCrc;
};



