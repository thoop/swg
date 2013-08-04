var should = require('should')
var application = require('../lib/application')

describe('application', function() {

    describe('encrypt', function() {

        it('should encrypt the anh example correctly', function() {
            var example_unencrypted = '000900010002AB43E3D500FF001145327643D4F100'; //took off ABCD crc value since CRC comes after encryption
            var example_encrypted = '00091D4F3285B60CD150B6F3D141F3C1A7022702F3'; //took off ABCD crc value since CRC comes after encryption

            var encrypted = application.encrypt(new Buffer(example_unencrypted, 'hex'), '1D4E3287');
            encrypted.toString('hex').toUpperCase().should.equal(example_encrypted);
        })
    })

    describe('decrypt', function() {

        it('should decrypt the anh example correctly', function() {
            var example_unencrypted = '000900010002AB43E3D500FF001145327643D4F100';
            var example_encrypted = '00091D4F3285B60CD150B6F3D141F3C1A7022702F3';

            var encrypted = application.decrypt(new Buffer(example_encrypted, 'hex'), '1D4E3287');
            encrypted.toString('hex').toUpperCase().should.equal(example_unencrypted);
        })
    })

    describe('checkAndRemoveCRC', function() {

        it('should throw an error if the crc is invalid', function() {
            try {
                application.checkAndRemoveCRC(new Buffer('00091D4F3285B60CD150B6F3D141F3C1A7022702F3', 'hex'));
            } catch (err) {
                return;
            }
            throw new Error('Should have thrown an error');
        })

        it('should check and remove the CRC from the buffer if the CRC is valid', function() {

            var newBuffer = application.checkAndRemoveCRC(new Buffer('00091D4F3285B60CD150B6F3D141F3C1A702276dE4', 'hex'));
            newBuffer.toString('hex').toUpperCase().should.equal('00091D4F3285B60CD150B6F3D141F3C1A70227');
        })
    })

})