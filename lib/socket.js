var util = require("util"); // For inheriting the EventEmitter stuff so we can use it via self.emit();
var EventEmitter = require("events").EventEmitter; // For emitting events so other node.js libraries and code can react to what we're doing here
var os = require("os"); // Used to check if we're running Windows, Linux or Mac (needed so we don't crash our app while binding our socket. Stupid bugs!

var sDgram = require('dgram'); // self library gives us UDP support
var scktClient = sDgram.createSocket('udp4'); // For sending data
var scktServer = sDgram.createSocket('udp4'); // For receiving data

var localIP = getBroadcastAddress(); // Get our local IP address
var broadcastip = "255.255.255.255"; // Where we'll send our "discovery" packet

var macAddress = ""; // Our MAC address. Needed to do stuff with the socket. Use self.setMacAddress(<your MAC address as bytes>) to set self.

var host = ""; // The IP address of our socket
var port = 10000 // The port we'll connect on
var payload = []; // The data we'll be sending
var twenties = ['0x20', '0x20', '0x20', '0x20', '0x20', '0x20']; // self appears at the end of a few packets we send, so put it here for shortness of code

var sState = false; // The current state of our socket

var retry = false; // If we can't discover our socket first go, try it again
var maxRetries = 3; // How many times we're to retry discovering our socket before giving up.
var retryInterval = 1000; // Retry after self many milliseconds
var retryTimer = ""; // A variable that will eventually hold our timer

var e = new EventEmitter(); // For emitting events such as "power changed" etc.
var self = '';

util.inherits(OrviboSocket, EventEmitter); // We want to get all the benefits of EventEmitter, but in our own class. self means we can use self.emit("Derp");

function OrviboSocket() { // The main function in our module. AFAIK, self is akin to a class myClass { } thing in PHP
	EventEmitter.call(self); // Needed so we can emit() from self module
	self = this;
	scktServer.on('message', function (message, remote) { // We've got a message back from the network
	    if (remote.address != localIP) { //Check message isn't from me.
			self.emit("messageReceived", message, remote.address, remote.port); // It's not from us, so let everyone know we've got data

	        var MessageHex = new Buffer(message).toString('hex'); // Convert our message into a string of hex
			var macHex = new Buffer(macAddress).toString('hex'); // And the same for our MAC address so [0xab, 0xcd, 0xef ...] becomes abcdef...
			
			switch(MessageHex.substr(0,12)) {
				case '6864002a7167': // self is our discovery packet
					self.emit("discovered", host);
					break;
				case '686400177366': // self is our 'state changed' packet
					self.emit("statechanged", MessageHex.substr(MessageHex.length - 1,1) == 0 ? 0 : 1); // Work out if we're on or off, and emit it. Ternary operators are fun!
					break;
				case '686400a87274': // We've got info about our device!
					var strName = MessageHex.split("202020202020")[4];
					strName = strName.split("2020202020")[0];
					self.emit("deviceinfo", hex2a(strName.toString('hex')));					
					break;
				case '686400176463':
					self.emit("statechanged", MessageHex.substr(MessageHex.length - 1,1) == 0 ? 0 : 1); // Work out if we're on or off, and emit it. Ternary operators are fun!
					break;
				case '68640018636c':
					self.emit("subscribed", MessageHex.substr(MessageHex.length - 1,1) == 0 ? 0 : 1);
					break;
				default:
					break;
				
			}
	       
	        if (host == '' && MessageHex.indexOf(macHex) > -1) { // If the message received contains our socket MAC address, save the IP address it came from, as that's our socket!
	            host = remote.address; // Set our host variable to the address the message came from
				self.setRetryDiscovery(false); // If we've set up an interval to retry discovery, cancel it.
	            self.emit("hostfound", host); // We've found our host! self usually means you're ready to start issuing on and off commands.
				
	        }
	    }
	}.bind(self)); // We add .bind(self) to the end of our function so that any calls to 'self' will refer to OrviboSocket and not to scktServer

}

OrviboSocket.prototype.prepare = function() { // Begin listening on our ports
	// Due to some funkyness between operating systems or opssibly node.js versions, we need to bind our client in two different ways.
	if(os.type() == "Windows_NT") { // Windows will only work if we setBroadcast(true) in a callback
		scktClient.bind(port, function() {
			scktClient.setBroadcast(true); // If we don't do self, we can't send broadcast packets to x.x.x.255, so we can never discover our sockets!		
		});
	} else { // While node.js on Linux (Raspbian, but possibly other distros) will chuck the sads if we have a callback, even if the callback does absolutely nothing (possibly a bug)
		scktClient.bind(port);
		scktClient.setBroadcast(true); // If we don't do self, we can't send broadcast packets to x.x.x.255, so we can never discover our sockets!
	}
	
	scktServer.bind(port, localIP); // Listen on port 10000

	self.emit("ready"); // TO-DO: Change self to something else, as it means we're bound, NOT that we're ready to turn the socket on and off. Potentially confusing!
}

OrviboSocket.prototype.discover = function() { // To discover sockets, we send out the payload below. Any socket that has the MAC address we specify, should respond back
	if(macAddress == "") { throw "No MAC address set!"; } // No MAC address set, so exit
    payload = []; // Clear out the payload variable
    payload = payload.concat(['0x68', '0x64', '0x00', '0x12', '0x71', '0x67'], macAddress, twenties); // We need our MAC address
	self.sendMessage(payload, broadcastip, function(){
		self.emit("discovering"); // TO-DO: Change self. It's confusing. The discovery packet was sent. It doesn't mean we've discovered anything yet!	
	}.bind(self)); // Broadcast it to everyone on our subnet!
	self.setRetryDiscovery(true);

}

OrviboSocket.prototype.subscribe = function() { // We've found a socket, now we just need to subscribe to it so we can control it.
	if(macAddress == "") { throw "No MAC address set!"; } // Whoops, no MAC address set! 
	if(host == "") { throw "No host set! Are you sure you've discovered a socket?"; } // We're trying to call subscribe, but we haven't even discovered a single socket yet!

    payload = [];
    payload = payload.concat(['0x68', '0x64', '0x00', '0x1e', '0x63', '0x6c'], macAddress, twenties, macAddress.slice().reverse(), twenties); // Subscribe. We need the reverse of our MAC address for some reason?
    self.sendMessage(payload, host, function(){
		self.emit("subscribing");
	}.bind(self)); 
	
}

OrviboSocket.prototype.query = function() {
	if(macAddress == "") { throw "No MAC address set!"; } // Whoops, no MAC address set! 
	if(host == "") { throw "No host set! Are you sure you've discovered a socket?"; } // We're trying to call subscribe, but we haven't even discovered a single socket yet!

    payload = [];
	//payload = ['0x68', '0x64', '0x00', '0x1d', '0x72', '0x74', '0xac', '0xcf', '0x23', '0x24', '0x09', '0x56', '0x20', '0x20', '0x20', '0x20', '0x20', '0x20', '0x00', '0x00', '0x00', '0x00', '0x04', '0x00', '0x00', '0x00', '0x00', '0x00', '0x00'];
	payload = payload.concat(['0x68', '0x64', '0x00', '0x1d', '0x72', '0x74'], macAddress, twenties, ['0x00', '0x00', '0x00', '0x00', '0x04', '0x00', '0x00', '0x00', '0x00', '0x00', '0x00']); // We need our MAC address
    self.sendMessage(payload, host, function(){
		self.emit("querying");
	}.bind(self)); // Send out our data!
	


}

OrviboSocket.prototype.setState = function(state) { // Here's where the magic begins! self function takes a boolean (state) and turns our socket on or off depending
	if(macAddress == "") { throw "No MAC address set!"; }
	if(host == "") { throw "No host set!"; }

	payload = [];
	if(state == true) {
	    payload = payload.concat(['0x68', '0x64', '0x00', '0x17', '0x64', '0x63'], macAddress, twenties, ['0x00', '0x00', '0x00', '0x00', '0x01']); // ON
	} else {
	     payload = payload.concat(['0x68', '0x64', '0x00', '0x17', '0x64', '0x63'], macAddress, twenties, ['0x00', '0x00', '0x00', '0x00', '0x00']); // OFF
	}

    self.sendMessage(payload, host, function(){
		self.emit("statechanging", state);
	}.bind(self)); 

}

OrviboSocket.prototype.getState = function() { // We want to know what our state is, so we send a discovery packet. self returns the state of our socket (0 or 1)
	return sState;	
}

OrviboSocket.prototype.setMacAddress = function(address) { // Set the MAC address so we can start discovering. self MUST be an array of bytes. Need to add checking code in here!
	macAddress = address;
	self.emit("macAddressChanged", address);	
}

OrviboSocket.prototype.sendMessage = function(message, sHost, callback) { // The fun (?) part of our module. Sending of the messages!
    message = new Buffer(message); // We need to send as a buffer. self line takes our message and makes it into one. 
    process.nextTick(function() {
		scktClient.send(message, 0, message.length, port, sHost, function(err, bytes) { // Send the message. Parameter 2 is offset, so it's 0. 
	        if (err) throw err;
	        self.emit("messageSent", message, sHost, scktServer.address().address); // Tell the world we've sent a packet. Include message, who it's being sent to, plus the address it's being sent from
	    }.bind(self)); // Again, we do .bind(self) so calling self.emit(); comes from OrviboSocket, and not from scktClient
		callback();
	}.bind(self));
}

OrviboSocket.prototype.setRetryDiscovery = function(state) {
	if(state == true && retry == true) {
		retryTimer = setInterval(function() {
			self.discover();
		}, retryInterval);

	} else {
		if (typeof retryTimer !== 'undefined') { // If we've set a retry timer for our discovery() function, we need to clear it
			clearInterval(retryTimer);
		}
	}
		self.emit("settingRetryDiscovery", state);	
}

OrviboSocket.prototype.isReady = function() {
	if(host == '') { 
		return false; 
	} else { 
		return true; 
	}	
}



function getBroadcastAddress() { // A bit of code that lets us get our network IP address
    var os = require('os')

	var interfaces = os.networkInterfaces();
	var addresses = [];
	for (k in interfaces) {
	    for (k2 in interfaces[k]) {
	        var address = interfaces[k][k2];
	        if (address.family == 'IPv4' && !address.internal) {
	            addresses.push(address.address)
	        }
	    }
	}

	return addresses;
}

function hex2a(hexx) {
    var hex = hexx.toString();//force conversion
    var str = '';
    for (var i = 0; i < hex.length; i += 2)
        str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
    return str;
}
 
module.exports = OrviboSocket; // And make every OrviboSocket function available to whatever file wishes to use it. 
