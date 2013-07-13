exports = module.exports = Route;

function Route(identifier, callbacks) {
	this.identifier = identifier;
	this.callbacks = callbacks;
}