var should = require('should')
var xor = require('../lib/xor')

describe('xor', function() {

	describe('encrypt', function() {

		it('should encrypt the anh example correctly', function() {
			var example_unencrypted = '00010002AB43E3D500FF001145327643D4F100';
			var example_encrypted = '1D4F3285B60CD150B6F3D141F3C1A7022702F3';

			var encrypted = xor.encrypt({
				buffer: new Buffer(example_unencrypted, 'hex'),
				crcSeed: '1D4E3287'
			});
			encrypted.toString('hex').toUpperCase().should.equal(example_encrypted);
		})

		it('should encrypt this correctly', function() {
			var unencrypted = '789c636138366dd32a1b0606060520160562be6b93ef5d7abfbf6fe19a4bef7c42f719c4ef53e6ddb23ae267526665fa0b81bccb6db3adbca48a16feea9ff67ffed2a4284d410628606528c9c8cf2f000039301f673031';
			var expected = 'dd96edebe5a08038cfbb863ec9bea628ccdc18435f334539e08c2ad87ac7c5a43830dc60d7633abd6559d8da373fbd203cbe01eb510dac57f587baa91f184cd6e1cae8feac8beed6cceec61f0421e91f0418d900633435';

			var encrypted = xor.encrypt({
				buffer: new Buffer(unencrypted, 'hex'),
				crcSeed: 'a50a8e8a'
			});
			encrypted.toString('hex').should.equal(expected);
		})
	})

	describe('decrypt', function() {

		it('should decrypt the anh example correctly', function() {
			var example_unencrypted = '00010002AB43E3D500FF001145327643D4F100';
			var example_encrypted = '1D4F3285B60CD150B6F3D141F3C1A7022702F3';

			var decrypted = xor.decrypt({
				buffer: new Buffer(example_encrypted, 'hex'),
				crcSeed: '1D4E3287'
			});
			decrypted.toString('hex').toUpperCase().should.equal(example_unencrypted);
		})

		it('should decrypt this correctly', function() {
			var encrypted = 'dd96edebe5a08038cfbb863ec9bea628ccdc18435f334539e08c2ad87ac7c5a43830dc60d7633abd6559d8da373fbd203cbe01eb510dac57f587baa91f184cd6e1cae8feac8beed6cceec61f0421e91f0418d900633435';
			var expected = '789c636138366dd32a1b0606060520160562be6b93ef5d7abfbf6fe19a4bef7c42f719c4ef53e6ddb23ae267526665fa0b81bccb6db3adbca48a16feea9ff67ffed2a4284d410628606528c9c8cf2f000039301f673031';

			var decrypted = xor.decrypt({
				buffer: new Buffer(encrypted, 'hex'),
				crcSeed: 'a50a8e8a'
			});
			decrypted.toString('hex').should.equal(expected);

		})
	})

})