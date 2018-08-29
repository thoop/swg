var should = require('should')
var xor = require('../lib/xor')
var Buffer = require('safe-buffer').Buffer;

describe('xor', function() {

	describe('encrypt', function() {

		it('should encrypt the anh example correctly', function() {
			var example_unencrypted = '00010002ab43e3d500ff001145327643d4f100';
			var example_encrypted = '1d4f3285b60cd150b6f3d141f3c1a7022702f3';

			var encrypted = xor.encrypt({
				buffer: Buffer.from(example_unencrypted, 'hex'),
				crcSeed: 2268220957
			});
			encrypted.toString('hex').should.equal(example_encrypted);
		})

		it('should encrypt this correctly', function() {
			var unencrypted = '789c636138366dd32a1b0606060520160562be6b93ef5d7abfbf6fe19a4bef7c42f719c4ef53e6ddb23ae267526665fa0b81bccb6db3adbca48a16feea9ff67ffed2a4284d410628606528c9c8cf2f000039301f673031';
			var expected = 'dd96edebe5a08038cfbb863ec9bea628ccdc18435f334539e08c2ad87ac7c5a43830dc60d7633abd6559d8da373fbd203cbe01eb510dac57f587baa91f184cd6e1cae8feac8beed6cceec61f0421e91f0418d900633435';

			var encrypted = xor.encrypt({
				buffer: Buffer.from(unencrypted, 'hex'),
				crcSeed: 2324564645
			});
			encrypted.toString('hex').should.equal(expected);
		})
	})

	describe('decrypt', function() {

		it('should decrypt the anh example correctly', function() {
			var example_unencrypted = '00010002ab43e3d500ff001145327643d4f100';
			var example_encrypted = '1d4f3285b60cd150b6f3d141f3c1a7022702f3';

			var decrypted = xor.decrypt({
				buffer: Buffer.from(example_encrypted, 'hex'),
				crcSeed: 2268220957
			});
			decrypted.toString('hex').should.equal(example_unencrypted);
		})

		it('should decrypt this correctly', function() {
			var encrypted = 'dd96edebe5a08038cfbb863ec9bea628ccdc18435f334539e08c2ad87ac7c5a43830dc60d7633abd6559d8da373fbd203cbe01eb510dac57f587baa91f184cd6e1cae8feac8beed6cceec61f0421e91f0418d900633435';
			var expected = '789c636138366dd32a1b0606060520160562be6b93ef5d7abfbf6fe19a4bef7c42f719c4ef53e6ddb23ae267526665fa0b81bccb6db3adbca48a16feea9ff67ffed2a4284d410628606528c9c8cf2f000039301f673031';

			var decrypted = xor.decrypt({
				buffer: Buffer.from(encrypted, 'hex'),
				crcSeed: 2324564645
			});
			decrypted.toString('hex').should.equal(expected);

		})
	})

})
