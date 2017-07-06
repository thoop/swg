var fs = require('fs');
var basename = require('path').basename;
var _ = require('lodash');

var packetHelper = exports = module.exports = {};

/*
 * Packets are loaded from the packets directory and added here on startup
 * key is packet name or opcode, value is packet object
 */
packetHelper.packets = {};

fs.readdirSync(__dirname + '/packets').forEach(function(filename){
    if (!/\.js$/.test(filename)) return;
    var name = basename(filename, '.js');
    var packet = require('./packets/' + name);
		if(packet.name) Object.defineProperty(packetHelper.packets, packet.name.toLowerCase(), {value: packet, enumerable: true});
		if(packet.opcode) Object.defineProperty(packetHelper.packets, packet.opcode.toLowerCase(), {value: packet, enumerable: true});
});

fs.readdirSync(__dirname + '/soe-packets').forEach(function(filename){
    if (!/\.js$/.test(filename)) return;
    var name = basename(filename, '.js');
    var packet = require('./soe-packets/' + name);
		if(packet.name) Object.defineProperty(packetHelper.packets, packet.name.toLowerCase(), {value: packet, enumerable: true});
		if(packet.opcode) Object.defineProperty(packetHelper.packets, packet.opcode.toLowerCase(), {value: packet, enumerable: true});
});


/*
 * takes an incoming buffer from a client and turns it into a packet object
 * this will need to be modified to handle multi-packet buffers
 */
packetHelper.bufferToPacket = function(options, callback) {
	var _this = this;
	var soeOpcode = options.buffer.slice(0, 2).toString('hex')

	if(this.packets[soeOpcode]) {

		this.packets[soeOpcode].bufferToPacket(options, function(err, packet) {
			if(err) return callback(err);

			callback(null, packet);
		});
	} else {
		console.log('WARNING: UNABLE TO FIND PACKET:', soeOpcode);
		callback(null, {soeOpcode: soeOpcode});
	}
};


packetHelper.parseObjIntoPacket = function(packetObj) {
	var _this = this;

	if(!Array.isArray(packetObj)) {
		packetObj = [packetObj];
	}

	var soePackets = [];
	var newPacket = {};

	packetObj.forEach(function(packet) {
		if(!packet || !packet.name) {
			console.log('Tried to send packet without a "name". Ignoring...', packet);
			return;
		}

		var newPacket = {};

		if(_this.packets[packet.name.toLowerCase()]) {

			soePackets.push(_this.packets[packet.name.toLowerCase()].parseObjIntoPacket(packet));

		} else {
			console.log('WARNING: no packet found for', packet.name);
		}
	});

	_.merge(newPacket, soePackets.shift());

	soePackets.forEach(function(soePacket) {
		newPacket.swgPackets.push(soePacket.swgPackets[0]);
	});

	return newPacket;
};



packetHelper.packetToBuffer = function(options, callback) {
	if(!options.packet || !options.packet.soeOpcode) return callback('ERROR: expected packet with soeOpcode: ' + JSON.stringify(options.packet));

	var _this = this;

	if(this.packets[options.packet.soeOpcode]) {

		this.packets[options.packet.soeOpcode].packetToBuffer(options, function(err, buffer) {
			if(err) return callback(err);

			callback(null, buffer);
		});
	} else {
		callback('ERROR: UNABLE TO FIND PACKET: ' + options.packet.soeOpcode);
	}
};