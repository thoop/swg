var should = require('should')
var packetHelper = require('../lib/network/packetHelper')
var Buffer = require('safe-buffer').Buffer;

describe('packetHelper', function() {

	describe('bufferToPacket', function() {

		it('should parse real soe_session_request request', function(done) {

			packetHelper.bufferToPacket({
				buffer: Buffer.from('00010000000258b026ca000001f0', 'hex')
			}, function(err, soePacket) {

				should.not.exist(err);
				soePacket.should.eql({
					soeOpcode: '0001',
					connectionId: 1487939274,
					crcLength: 2,
					clientUDPSize: 496
				});
				done();
			});
		});

		it('should parse real soe_session_reply request', function(done) {

			packetHelper.bufferToPacket({
				buffer: Buffer.from('000258b026ca28ffa004020104000001f0', 'hex')
			}, function(err, soePacket) {

				should.not.exist(err);
				soePacket.should.eql({
					soeOpcode: '0002',
					connectionId: 1487939274,
					crcSeed: 687841284,
					crcLength: 2,
					useCompression: 1,
					seedSize: 4,
					serverUDPSize: 496
				});
				done();
			});
		});

		it('should parse real soe_net_status_req request', function(done) {

			packetHelper.bufferToPacket({
				buffer: Buffer.from('00076b975d62095750faa96373fabda6736bbc59d4', 'hex'),
				crcSeed: 747506451,
				crcLength: 2
			}, function(err, packet) {

				should.not.exist(err);
				done();
			});
		});

		it('should parse real soe_net_status_res response', function(done) {

			packetHelper.bufferToPacket({
				buffer: Buffer.from('00083869fb133c7ffb133c7ffb133c7dfb133c7dfb133c7cfb133c7cfb133c7dfb133c7dfb133c3e3c38f5', 'hex'),
				crcSeed: 747506451,
				crcLength: 2
			}, function(err, soePacket) {

				should.not.exist(err);
				soePacket.should.have.property('soeOpcode', '0008');
				done();
			});
		});

		it('should parse real ack request', function(done) {

			packetHelper.bufferToPacket({
				buffer: Buffer.from('0015131113fae4', 'hex'),
				crcSeed: 747506451,
				crcLength: 2
			}, function(err, soePacket) {

				should.not.exist(err);
				soePacket.should.have.property('soeOpcode', '0015');
				soePacket.should.have.property('sequence', 2);
				done();
			});
		});

		it('should parse real 0009 request', function(done) {

			packetHelper.bufferToPacket({
				buffer: Buffer.from('0009130b8a2c8514996d8214ea1ae5758472d5738401a214e56fca1ae55dfa2ad06dce1ae840ff22d270cfff8d56', 'hex'),
				crcSeed: 747506451,
				crcLength: 2
			}, function(err, soePacket) {

				should.not.exist(err);
				soePacket.should.have.property('soeOpcode', '0009');
				soePacket.should.have.property('sequence', 0);
				soePacket.swgPackets[0].should.eql({
					operandCount: 4,
					opcode: '41131f96',
					username: 'swganh0',
					password: 'swganh',
					version: '20050408-18:00'
				});
				done();
			});
		});

		it('should parse another real 0009 request', function(done) {
			packetHelper.bufferToPacket({
				buffer: Buffer.from('0009333a21b3a52532f2a2254185c5442fedf5422f9e82254ef0ea2b4ec2da1b7bf2ee2b43dfdf1379efefdf709b', 'hex'),
				crcSeed: 3005561395,
				crcLength: 2
			}, function(err, soePacket) {

				should.not.exist(err);
				soePacket.should.have.property('soeOpcode', '0009');
				soePacket.should.have.property('sequence', 0);
				soePacket.swgPackets[0].should.eql({
					operandCount: 4,
					opcode: '41131f96',
					username: 'swganh0',
					password: 'swganh',
					version: '20050408-18:00'
				});
				done();
			});
		});

		it('should parse a third real 0009 request', function(done) {
			packetHelper.bufferToPacket({
				buffer: Buffer.from('0009333a21b3f5ac9319c9ac9319e9ac9319fcac9319f27a00c72095bf4981396da7cd6cd39792d2f09a2679a8634410d104ac00bfd72a9b859d30e92467bf7fdbf81a1d81d11b1d81d11b1d81d11c1df2a67b7c9cce4b7bf040', 'hex'),
				crcSeed: 3005561395,
				crcLength: 2
			}, function(err, soePacket) {

				should.not.exist(err);
				soePacket.should.have.property('soeOpcode', '0009');
				soePacket.should.have.property('sequence', 0);
				soePacket.swgPackets[0].should.eql({
					operandCount: 4,
					opcode: 'aab296c6',
					userId: 0,
					userName: 'swganh0',
					sessionKey: '20000000150000000ed693ded2efbf8ea1acd2ee4c55be305fbe230db4ab58f962697967e8106ed3869b3a4a1a72a1fa8f96ff9fa5625a2901000000'
				});
				done();
			});
		});

		it('should parse a real multi 0009 packet', function(done) {
			packetHelper.bufferToPacket({
				buffer: Buffer.from('0009130a8e351d098e8c7e154f8c7e154f8e7e154f847d15f92a4b21f92a4b4b4bd37d', 'hex'),
				crcSeed: 747506451,
				crcLength: 2
			}, function(err, soePacket) {

				should.not.exist(err);
				soePacket.should.have.property('soeOpcode', '0009');
				soePacket.should.have.property('swgPackets');
				soePacket.swgPackets.should.containEql({
					operandCount: 3,
					opcode: 'c11c63b9',
					ServerCount: 0,
					MaxCharsPerAccount: 2
				});
				soePacket.swgPackets.should.containEql({
					operandCount: 3,
					opcode: '3436aeb6',
					ServerCount: 0
				});
				done();
			});
		});
	});





	describe('parseObjIntoPacket', function() {

		it('should return an 0001 SEO packet object correctly', function() {
			var soePacket = packetHelper.parseObjIntoPacket({
				name: 'soe_session_request',
				crcLength: 2,
				connectionId: 1487939274,
				clientUDPSize: 496
			});

			soePacket.should.eql({
				soeOpcode: '0001',
				crcLength: 2,
				connectionId: 1487939274,
				clientUDPSize: 496
			});
		});

		it('should return an 0002 SEO packet object correctly', function() {
			var soePacket = packetHelper.parseObjIntoPacket({
				name: 'soe_session_reply',
				connectionId: 1487939274,
				crcSeed: 687841284,
				crcLength: 2,
				useCompression: 1,
				seedSize: 4,
				serverUDPSize: 496
			});

			soePacket.should.eql({
				soeOpcode: '0002',
				connectionId: 1487939274,
				crcSeed: 687841284,
				crcLength: 2,
				useCompression: 1,
				seedSize: 4,
				serverUDPSize: 496
			});
		});


		it('should return an 0009 SEO packet object correctly with SWG packet data', function() {
			var soePacket = packetHelper.parseObjIntoPacket({
				name: 'LoginClientId',
				username: 'swg',
				password: 'password',
				version: '123456'
			});

			soePacket.should.have.property('soeOpcode', '0009');
			soePacket.swgPackets[0].should.eql({
				name: 'LoginClientId',
				opcode: '41131f96',
				operandCount: 4,
				username: 'swg',
				password: 'password',
				version: '123456'
			});
		});


		it('should return a multi 0009 SEO packet object correctly with SWG packet data', function() {
			var soePacket = packetHelper.parseObjIntoPacket([
				{
					name: 'LoginEnumCluster',
					ServerCount: 0,
					MaxCharsPerAccount: 2
				},
				{
					name: 'LoginClusterStatus',
					opcode: '3436aeb6',
					ServerCount: 0
				}
			]);

			soePacket.should.have.property('soeOpcode', '0009');
			soePacket.swgPackets[0].should.containEql({
				name: 'LoginEnumCluster',
				operandCount: 3,
				opcode: 'c11c63b9',
				ServerCount: 0,
				MaxCharsPerAccount: 2
			});
			soePacket.swgPackets[1].should.containEql({
				name: 'LoginClusterStatus',
				operandCount: 3,
				opcode: '3436aeb6',
				ServerCount: 0
			});
		});
	});






	describe('packetToBuffer', function() {

		it('should take an soe 0001 packet and create a correct, non-encrypted buffer to send', function(done) {
			packetHelper.packetToBuffer({
				packet: {
					soeOpcode: '0001',
					crcLength: 2,
					connectionId: 1487939274,
					clientUDPSize: 496
				}
			}, function(err, buffer) {

				should.not.exist(err);
				buffer.toString('hex').should.equal('00010000000258b026ca000001f0');
				done();
			});
		});

		it('should take an soe 0015 packet and create a correct buffer to send', function(done) {
			packetHelper.packetToBuffer({
				crcSeed: 747506451,
				crcLength: 2,
				packet: {
					soeOpcode: '0015',
					sequence: 2
				}
			}, function(err, buffer) {

				should.not.exist(err);
				buffer.toString('hex').should.equal('0015131113fae4');
				done();
			});
		});

		it('should take a data packet and create a correct buffer to send', function(done) {
			packetHelper.packetToBuffer({
				crcSeed: 747506451,
				crcLength: 2,
				packet: {
					soeOpcode: '0009',
					swgPackets: [
						{
							opcode: '41131f96',
							username: 'swganh0',
							password: 'swganh',
							version: '20050408-18:00'
						}
					]
				}
			}, function(err, buffer) {

				should.not.exist(err);
				buffer.toString('hex').should.equal('0009130b8a2c8514996d8214ea1ae5758472d5738401a214e56fca1ae55dfa2ad06dce1ae840ff22d270cfff8d56');
				done();
			});
		});

		it('should take a data packet and create a correct buffer to send 2', function(done) {
			packetHelper.packetToBuffer({
				crcSeed: 3005561395,
				crcLength: 2,
				packet: {
					soeOpcode: '0009',
					swgPackets: [
						{
							opcode: 'aab296c6',
							sessionKey: '20000000150000000ed693ded2efbf8ea1acd2ee4c55be305fbe230db4ab58f962697967e8106ed3869b3a4a1a72a1fa8f96ff9fa5625a2901000000',
							userId: 0,
							userName: 'swganh0'
						}
					]
				}
			}, function(err, buffer) {

				should.not.exist(err);
				buffer.toString('hex').should.equal('0009333a21b3f5ac9319c9ac9319e9ac9319fcac9319f27a00c72095bf4981396da7cd6cd39792d2f09a2679a8634410d104ac00bfd72a9b859d30e92467bf7fdbf81a1d81d11b1d81d11b1d81d11c1df2a67b7c9cce4b7bf040');
				done();
			});
		});


		it('should take a multi packet data packet and create a correct buffer to send', function(done) {
			packetHelper.packetToBuffer({
				crcSeed: 747506451,
				crcLength: 2,
				packet: {
					soeOpcode: '0009',
					sequence: 1,
					swgPackets: [
						{
							opcode: 'c11c63b9',
							ServerCount: 0,
							MaxCharsPerAccount: 2
						},
						{
							opcode: '3436aeb6',
							ServerCount: 0
						}
					]
				}
			}, function(err, buffer) {

				should.not.exist(err);
				buffer.toString('hex').should.equal('0009130a8e351d098e8c7e154f8c7e154f8e7e154f847d15f92a4b21f92a4b4b4bd37d');
				done();
			});
		});
	});

})
