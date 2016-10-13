var should = require('should');
var sinon = require('sinon');
var Application = require('../lib/application');

describe('application', function() {

	describe('sendPacket', function() {

		it('should take a packet name + packet data and send a valid response', function(done) {

			var spy = sinon.spy()
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

		it('should acknowledge an incoming data packet automatically if it has a sequence number');
	});


	describe('sendRaw', function() {

		it('should allow you to pass in a buffer and it will send the response', function() {
			var spy = sinon.spy()
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
			var spy = sinon.spy()
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

})