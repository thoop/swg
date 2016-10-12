var should = require('should')
var crc = require('../lib/crc')

describe('crc', function() {

	describe('crc', function() {

		it('should return the correct crc', function() {
			var result = crc('test', 12345);
			result.should.eql(865488704);
		})
	});

})