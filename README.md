[![Stories in Ready](https://badge.waffle.io/thoop/swg.png)](http://waffle.io/thoop/swg)  

Fun project for emulating a Star Wars Galaxies server built in javascript. Currently only tested on OSX.

This is a framework similar to ExpressJS that has been adapted to the SOE SWG protocol for making SWG clients/servers.

This library handles all of the packet transfer, encryption/decryption, inflate/deflate, CRC checking, and packet reconstructing. All you have to do is write the server logic.

Example usage to build your own server/client:

```
var swg = require('swg');
var app = swg();

app.on('LoginClientId', function(req, res, next) {
	res.sendPacket({
		name: 'LoginClientToken',
		sessionKey: 'aaaaaaaa',
		userId: 0,
		userName: 'username'
	});
});

app.listen(44453, function() {
	console.log('server listening ' + app.server.address().address + ':' + app.server.address().port);
});
```

For a simple login server example: [SWG login server](https://github.com/thoop/swg-login-server-node)

For a simple, fake SWG client example (so you don't have to run a real SWG client): [SWG client server](https://github.com/thoop/swg-client-node)