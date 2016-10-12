var should = require('should');
var packet = require('../lib/network/packet');
var defaults = require('../lib/defaults');

describe('packet', function() {

	describe('inflate', function() {
		it('should inflate and remove the compression flag only if the packet is compressed', function(done) {

			packet._inflateAndRemoveCompressionFlag({
				buffer: Buffer.from('0009789c6360606198262fecc8ce505c9e9e989761c00665f031181918981a981858e81a5a5819180000bb79092c01', 'hex')
			}, function(err, buffer) {
				buffer.toString('hex').should.equal('000900000400961f13410700737767616e68300600737767616e680e0032303035303430382d31383a3030')
				done(err);
			});
		});

		it('should not inflate but still remove the compression flag if the packet is not compressed', function(done) {

			packet._inflateAndRemoveCompressionFlag({
				buffer: Buffer.from('000900000400961f13410700737767616e68300600737767616e680e0032303035303430382d31383a303000', 'hex')
			}, function(err, buffer) {
				buffer.toString('hex').should.equal('000900000400961f13410700737767616e68300600737767616e680e0032303035303430382d31383a3030')
				done(err);
			});
		});
	});

	describe('deflate', function() {
		it('should deflate and add the compression flag if compression is turned on', function(done) {
			defaults.useCompression = true;

			packet._deflateAndAddCompressionFlag({
				buffer: Buffer.from('000900000400961f13410700737767616e68300600737767616e680e0032303035303430382d31383a3030', 'hex')
			}, function(err, buffer) {
				buffer.toString('hex').should.equal('0009789c6360606198262fecc8ce505c9e9e989761c00665f031181918981a981858e81a5a5819180000bb79092c01')
				done(err);
			});
		});

		it('should not deflate but still add the compression flag if compression is turned off', function(done) {
			defaults.useCompression = false;

			packet._deflateAndAddCompressionFlag({
				buffer: Buffer.from('000900000400961f13410700737767616e68300600737767616e680e0032303035303430382d31383a3030', 'hex')
			}, function(err, buffer) {
				buffer.toString('hex').should.equal('000900000400961f13410700737767616e68300600737767616e680e0032303035303430382d31383a303000')
				done(err);
			});
		});
	});

	describe('encrypt', function() {

		it('should encrypt the anh example correctly', function(done) {
			var example_unencrypted = '000900010002ab43e3d500ff001145327643d4f100'; //took off ABCD crc value since CRC comes after encryption
			var example_encrypted = '00091d4f3285b60cd150b6f3d141f3c1a7022702f3'; //took off ABCD crc value since CRC comes after encryption

			packet._encrypt({
				buffer: new Buffer(example_unencrypted, 'hex'),
				crcSeed: 2268220957
			}, function(err, buffer) {
				buffer.toString('hex').should.equal(example_encrypted);
				done()
			});
		})
	})

	describe('decrypt', function() {

		it('should decrypt the anh example correctly', function(done) {
			var example_unencrypted = '000900010002ab43e3d500ff001145327643d4f100';
			var example_encrypted = '00091d4f3285b60cd150b6f3d141f3c1a7022702f3';

			packet._decrypt({
				buffer: new Buffer(example_encrypted, 'hex'),
				crcSeed: 2268220957
			}, function(err, buffer) {
				buffer.toString('hex').should.equal(example_unencrypted);
				done()
			});
		})
	})

	describe('checkAndRemoveCRC', function() {

		it('should call the callback with an error if the crc is invalid', function(done) {
			packet._checkAndRemoveCRC({
				buffer: new Buffer('0009130b8a2c8514996d8214ea1ae5758472d5738401a214e56fca1ae55dfa2ad06dce1ae840ff22d270cfff8d54', 'hex'),
				crcSeed: 747506451,
				crcLength: 2
			}, function(err, newBuffer) {
				should.not.exist(newBuffer);
				should.exist(err);
				done()
			});
		})

		it('should check and remove the CRC from the buffer if the CRC is valid', function(done) {

			packet._checkAndRemoveCRC({
				buffer: new Buffer('0009130b8a2c8514996d8214ea1ae5758472d5738401a214e56fca1ae55dfa2ad06dce1ae840ff22d270cfff8d56', 'hex'),
				crcSeed: 747506451,
				crcLength: 2
			}, function(err, newBuffer) {
				should.not.exist(err);
				newBuffer.toString('hex').should.equal('0009130b8a2c8514996d8214ea1ae5758472d5738401a214e56fca1ae55dfa2ad06dce1ae840ff22d270cfff');
				done();
			});
		})
	})


	describe('getHexInt', function() {

		it('should return zeros if no value is sent', function() {

			packet._getHexInt(0, 2).should.equal('00');
			packet._getHexInt(null, 2).should.equal('00');

			packet._getHexInt(0, 4).should.equal('0000');
			packet._getHexInt(null, 4).should.equal('0000');

			packet._getHexInt(0, 8).should.equal('00000000');
			packet._getHexInt(null, 8).should.equal('00000000');
		});

		it('should return hex that is left padded by zeros', function() {

			packet._getHexInt(1, 2).should.equal('01');

			packet._getHexInt(1, 4).should.equal('0001');

			packet._getHexInt(1, 8).should.equal('00000001');
		});
	});
})