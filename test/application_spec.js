var should = require('should');
var sinon = require('sinon');
var Application = require('../lib/application');
var defaults = require('../lib/defaults');
var sandbox;
describe('application', function() {

	beforeEach(function() {
		sandbox = sinon.createSandbox();
	});

	afterEach(function() {
		sandbox.restore();
	});

	describe('send', function() {

		it('should take a packet name + packet data and send a valid response', function(done) {

			var spy = sandbox.spy()
			Application.prototype.server = {
				send: spy
			};

			Application.prototype.send({
				packet: {
					name: 'LoginClientId',
					username: 'swganh0',
					password: 'swganh',
					version: '20050408-18:00'
				},
				crcSeed: 747506451,
				port: 123,
				address: 'example.com'
			}, function(err) {
				spy.firstCall.args[0].toString('hex').should.equal('0009130b8a2c8514996d8214ea1ae5758472d5738401a214e56fca1ae55dfa2ad06dce1ae840ff22d270cfff8d56');
				spy.firstCall.args[1].should.equal(0);
				spy.firstCall.args[2].should.equal(46);
				spy.firstCall.args[3].should.equal(123);
				spy.firstCall.args[4].should.equal('example.com');
				done(err);
			});

		});


		it('should add a sequence number automatically to data packets');
	});


	describe('sendRaw', function() {

		it('should allow you to pass in a buffer and it will send the response', function() {
			var spy = sandbox.spy()
			Application.prototype.server = {
				send: spy
			};

			Application.prototype.sendRaw(Buffer.from('0000000000000000', 'hex'), 80, 'example.com');

			Buffer.isBuffer(spy.firstCall.args[0]).should.equal(true);
			spy.firstCall.args[1].should.equal(0);
			spy.firstCall.args[2].should.equal(8);
			spy.firstCall.args[3].should.equal(80);
			spy.firstCall.args[4].should.equal('example.com');
		});


		it('should allow you to pass in a string and it will send the response', function() {
			var spy = sandbox.spy()
			Application.prototype.server = {
				send: spy
			};

			Application.prototype.sendRaw('0000000000000000', 80, 'example.com');

			Buffer.isBuffer(spy.firstCall.args[0]).should.equal(true);
			spy.firstCall.args[1].should.equal(0);
			spy.firstCall.args[2].should.equal(8);
			spy.firstCall.args[3].should.equal(80);
			spy.firstCall.args[4].should.equal('example.com');
		});
	});


	describe('handleMessage', function() {

		it('should take a buffer for an 0001 packet and call _router.middleware once with the SOE packet', function() {
			var spy = sandbox.spy()
			Application.prototype._router = {
				middleware: spy
			};

			var requestInfo = {
				port: 80,
				address: '127.0.0.1'
			};

			Application.prototype._handleMessage(Buffer.from('00010000000258b026ca000001f0', 'hex'), requestInfo);

			spy.firstCall.args[0].packet.should.eql({
				soeOpcode: '0001',
				crcLength: 2,
				connectionId: 1487939274,
				clientUDPSize: 496
			})
		});

		it('should take a buffer for an 0009 packet and call _router.middleware once with the SWG packet', function() {
			var spy = sandbox.spy()
			Application.prototype._router = {
				middleware: spy
			};

			var requestInfo = {
				port: 80,
				address: '127.0.0.1'
			};

			defaults.crcSeed = 747506451;

			Application.prototype._handleMessage(Buffer.from('0009130b8a2c8514996d8214ea1ae5758472d5738401a214e56fca1ae55dfa2ad06dce1ae840ff22d270cfff8d56', 'hex'), requestInfo);

			spy.firstCall.args[0].packet.should.eql({
				operandCount: 4,
				opcode: '41131f96',
				username: 'swganh0',
				password: 'swganh',
				version: '20050408-18:00'
			})
		});


		it('should take a buffer for an 0009 multi packet and call _router.middleware twice with the different SWG packets', function() {
			var spy = sandbox.spy()
			Application.prototype._router = {
				middleware: spy
			};

			var requestInfo = {
				port: 80,
				address: '127.0.0.1'
			};

			defaults.crcSeed = 747506451;

			Application.prototype._handleMessage(Buffer.from('0009130a8e351d098e8c7e154f8c7e154f8e7e154f847d15f92a4b21f92a4b4b4bd37d', 'hex'), requestInfo);

			spy.firstCall.args[0].packet.should.eql({
				operandCount: 3,
				opcode: 'c11c63b9',
				ServerCount: 0,
				MaxCharsPerAccount: 2
			})

			spy.secondCall.args[0].packet.should.eql({
				operandCount: 3,
				opcode: '3436aeb6',
				ServerCount: 0
			})
		});


		it('should send an acknowledge packet for incoming data packet automatically if it has a sequence number', function() {
			var stub = sandbox.stub(Application.prototype, 'sendRaw');
			var spy = sandbox.spy()
			Application.prototype._router = {
				middleware: spy
			};

			Application.prototype.lastAck = -1;

			var requestInfo = {
				port: 80,
				address: '127.0.0.1'
			};

			defaults.crcSeed = 747506451;

			Application.prototype._handleMessage(Buffer.from('0009130b8a2c8514996d8214ea1ae5758472d5738401a214e56fca1ae55dfa2ad06dce1ae840ff22d270cfff8d56', 'hex'), requestInfo);

			stub.firstCall.args[0].should.eql(Buffer.from('00151313139866', 'hex'));
			stub.firstCall.args[1].should.eql(80);
			stub.firstCall.args[2].should.eql('127.0.0.1');

			spy.firstCall.args[0].packet.should.eql({
				operandCount: 4,
				opcode: '41131f96',
				username: 'swganh0',
				password: 'swganh',
				version: '20050408-18:00'
			})
		});
	});

})