var OrviboSocket = require("../lib/socket.js");
var o = new OrviboSocket();
var t;

o.on("ready", function() {
	c("Ready. Now detecting sockets");
	t = setInterval(function() {
		o.discover();
	}, 1000);
});

o.on("discovering", function() {
	c("Discovering sockets ..");
});

o.on('socketfound', function(index) { 
	clearInterval(t);
	c("Socket found! Index is " + index + ". Subscribing .."); 
	o.subscribe(); 
	c("Rediscovering sockets ..");
	o.discover();
}) // We've found a socket. Subscribe to it if we haven't already!

o.on('subscribed', function(index, state) { 
	c("Socket index " + index + " successfully subscribed. State is " + state + ". Querying ..");
	o.query(); 
}); // We've subscribed to our device. Now we need to grab its name!

o.on('queried', function(index, name) {
	c("Socket " + index + " has a name. It's " + name);
	
	// Register a device
	process.nextTick(function() {
		console.log("[NINJA] pretend we've emitted our new device here");
	});
	
	setInterval(function() { 
		o.setState(index, !o.getState(index));
	}, 1000);
	
});

c("Preparing ..");
o.prepare();

function c(text) {
	console.log(text);
}