var util = require("util"); // For inheriting the EventEmitter stuff so we can use it via this.emit();
var EventEmitter = require("events").EventEmitter; // For emitting events so other node.js libraries and code can react to what we're doing here
var os = require("os"); // Used to check if we're running Windows, Linux or Mac (needed so we don't crash our app while binding our socket. Stupid bugs!
var S = require("string");

util.inherits(OrviboEmulator, EventEmitter); // We want to get all the benefits of EventEmitter, but in our own class. this means we can use this.emit("Derp");

var sDgram = require('dgram'); // this library gives us UDP support
var scktClient = sDgram.createSocket('udp4'); // For sending data
var scktServer = sDgram.createSocket('udp4'); // For receiving data
var localIP = getBroadcastAddress(); // Get our local IP address
var broadcastip = "255.255.255.255"; // Where we'll send our "discovery" packet
var port = 10000 // The port we'll connect on
var payload = []; // The data we'll be sending
var twenties = "202020202020"; // this appears at the end of a few packets we send, so put it here for shortness of code

var hosts = [];

/* var macAddress = "accfabcdef12"; // Some defaults
var macReversed = "12efcdabcfac";
var socketName = "Office";
var state = "01"; */

function OrviboEmulator() {
	EventEmitter.call(this); // Needed so we can emit() from this module
	console.log(localIP);
	scktServer.on('message', function (message, remote) { // We've got a message back from the network
		if (remote.address != localIP) { //Check message isn't from us
			var MessageHex = new Buffer(message).toString('hex'); // Convert our message into a string of hex
			this.emit('data', message, remote);
			var remoteMac = MessageHex.substr(MessageHex.indexOf('accf'), 12); // Look for the first occurance of ACCF (the start of our MAC address) and grab it, plus the next 12 bytes
			index = hosts.map(function(e) { return e.macAddress; }).indexOf(remoteMac); // Use the arr.map() and indexOf functions to find out where in our array, our socket is
			var type;
				switch(MessageHex.substr(0,12)) { // Look for the first twelve bytes
					case "686400067161":
						console.log("Discovery request from: " + remote.address);
						hosts.forEach(function(item) {

							item.remote = remote.address;
							item.ready = true;
						
							// C0192423CFAC202020202020534F4330303228CA6CD701
							payload = "6864002a716100" + item.macAddress + twenties + item.macReversed + twenties + "534F43303032FED989D7" + item.state;
							this.sendMessage(hex2ba(payload),remote.address);
							console.log("Discovery response sent");
							
						}.bind(this));
						break;
					case "686400127167":
						mIndex = hosts.map(function(e) { return e.macAddress; }).indexOf(remoteMac);
						if(mIndex > -1) {
							hosts[index].remote = remote.address;
							hosts[index].ready = true;
							payload = "6864002a716100" + hosts[mIndex].macAddress + twenties + hosts[mIndex].macReversed + twenties + "534F43303032FED989D7" + hosts[mIndex].state;
							this.sendMessage(hex2ba(payload),remote.address);						
						}
						break;
					case "6864001e636c":
						console.log("Subscription request from " + remote.address);
						payload = "68640018636C" + hosts[index].macAddress + twenties + "0000000000" + hosts[index].state
						this.sendMessage(hex2ba(payload),remote.address);
						console.log("Subscription response sent");
						break;
					case "6864001d7274":
						console.log("Query request from " + remote.address);
						namepad = S(hosts[index].name).padRight(16, " ").s;
						namepad = new Buffer(namepad);
						ip = "C0A8010E" // REPLACE ME!
						
						switch(MessageHex.substr(MessageHex.length - 14, 2)) {
							case "01":
								console.log("Table 1");
								payload = "686400247274"
									+ hosts[index].macAddress
									+ twenties
									+ "020000000001000100000600040004000200";
								break;
							case "04":
								console.log("Table 4");							
								payload = "686400A87274" // Magic key, message length, command ID
									+ hosts[index].macAddress 
									+ twenties 
									+ "020000000004000100008A0001004325" // Record number and other junk we don't care about :)
									+ hosts[index].macAddress 
									+ twenties 
									+ hosts[index].macReversed 
									+ twenties 
									+ "383838383838" // Remote password
									+ twenties // Padding for the remote password
									+ namepad.toString('hex') // Socket name including padding
									+ "0400" // The socket icon
									+ "10000000" // Hardware version
									+ "09000000" // Firmware version
									+ "05000000" // Chip firmware version
									+ "1027" // Port 10000
									+ "2a796fd0" // The remote port (for remote access?)
									+ "1027" // Remote port 10000
									+ "766963656e7465722e6f727669626f2e636f6d" // vicenter.orvibo.com
									+ "202020202020202020202020202020202020202020" // And padding for remote address above
									+ ip
									+ "c0a80101" // Local gateway (modem etc.)
									+ "ffffff00" // Subnet mask
									+ "01" // DHCP is on?
									+ "01" // Discoverable?
									+ "000a" // Timezone
									+ "0000" // ?? Sample data says 0000 but real data says 00FF. What means?
									+ "0000"; // Countdown timer
								break;
							default:
								throw "Unhandled table data. Hex was: " + MessageHex.toString('hex');
								break;
						}
						
						
						this.sendMessage(hex2ba(payload),remote.address);
						console.log("Query reply sent");
						break;
					case "6864001a6373": // I don't know what this is, but the SmartPoint app asks the socket for it, so here it is!
						console.log("Data Packet 'A' received");
						payload = "686400176373"
							+ hosts[index].macAddress
							+ twenties
							+ "0000000000"; // Does state go on the end here?
						this.sendMessage(hex2ba(payload),remote.address);
						console.log("Data Packet 'A' responded to");						
						break;
					case "686400166862":
						console.log("Data Packet 'B' received");					
						payload = "686400176862"
							+ hosts[index].macAddress
							+ twenties
							+ "0000000000";
						this.sendMessage(hex2ba(payload),remote.address);
						console.log("Data Packet 'A' responded to");
						break;							
					case "686400176463":
						console.log("Request to change state received");
						hosts[index].state = MessageHex.substr(MessageHex.length - 2,2) == "01" ? "01" : "00";
						payload = "686400177366" + hosts[index].macAddress + "00000000" + hosts[index].state;
						this.sendMessage(hex2ba(payload),remote.address);
						console.log("Response to state change sent. New state is: " + hosts[index].state);
						break;
		
				}
			
		}

}.bind(this));

}

OrviboEmulator.prototype.prepare = function() {

	// Due to some funkyness between operating systems or possibly node.js versions, we need to bind our client in two different ways.
	if(os.type() == "Windows_NT") { // Windows will only work if we setBroadcast(true) in a callback
		console.log("Binding port " + port + " to host " + localIP + " using Windows method");
		scktClient.bind(port, function() {
			scktClient.setBroadcast(true); // If we don't do this, we can't send broadcast packets to x.x.x.255, so we can never discover our sockets!		
		});
	} else { // While node.js on Linux (Raspbian, but possibly other distros) will chuck the sads if we have a callback, even if the callback does absolutely nothing (possibly a bug)
		console.log("Binding port " + port + " to host " + localIP + " using Linux method");
		scktClient.bind(port);
		scktClient.setBroadcast(true); // If we don't do this, we can't send broadcast packets to x.x.x.255, so we can never discover our sockets!
	}
	scktServer.bind(port, localIP); // Listen on port 10000

	
}

OrviboEmulator.prototype.setMACAddress = function(index, addr, addrReversed) {
	hosts[index].macAddress = addr;
	hosts[index].macReversed = addrReversed;	
}

OrviboEmulator.prototype.setName = function(index, sName) {
	hosts[index].name = sName;	
}

OrviboEmulator.prototype.setState = function(index, sState) {
	if(hosts[index].ready == true) {
		console.log("State: " + sState);
		hosts[index].state = sState
		console.log("State: " + sState);
		payload = "686400177366" + hosts[index].macAddress + "00000000" + hosts[index].state;
		this.sendMessage(hex2ba(payload),hosts[index].remote);
	}
}

OrviboEmulator.prototype.getMACAddress = function(index) {
	return hosts[index].macAddress;
}

OrviboEmulator.prototype.hosts = hosts;

OrviboEmulator.prototype.sendMessage = function(message, sHost, callback) {
    message = new Buffer(message); // We need to send as a buffer. this line takes our message and makes it into one. 
    process.nextTick(function() { // Next time we're processing stuff. To keep our app from running away from us, I suppose
		scktClient.send(message, 0, message.length, port, sHost, function(err, bytes) { // Send the message. Parameter 2 is offset, so it's 0. 
	        if (err) throw err; // Error? CRASH AND BURN BB!
			this.emit('sent', message, sHost);
	    }.bind(this)); // Again, we do .bind(this) so calling this.emit(); comes from OrviboSocket, and not from scktClient
		if(typeof callback === "function") { callback(); } // And if we've specified a callback function, go right ahead and do that, as we've sent the message
	}.bind(this));
}

function getBroadcastAddress() { // A bit of code that lets us get our network IP address
    var os = require('os')

	var interfaces = os.networkInterfaces(); // Get a list of interfaces
	var addresses = [];
	for (k in interfaces) { // Loop through our interfaces
	    for (k2 in interfaces[k]) { // And our sub-interfaces
	        var address = interfaces[k][k2]; // Get the address 
	        if (address.family == 'IPv4' && !address.internal) { // If we're IPv4 and it's not an internal address (like 127.0.0.1)
	            return address.address // Shove it onto our addresses array
	        }
	    }
	}

	return 0;
}

function hex2ba(hex) { // Takes a string of hex and turns it into a byte array: ['0xAC', '0xCF] etc.
    arr = []; // New array
	for (var i = 0; i < hex.length; i += 2) { // Loop through our string, jumping by 2 each time
	    arr.push("0x" + hex.substr(i, 2)); // Push 0x and the next two bytes onto the array
	}
	return arr;
}

function hex2a(hexx) { // Takes a hex string and turns it into an ASCII string
    var hex = hexx.toString();//force conversion
    var str = '';
    for (var i = 0; i < hex.length; i += 2)
        str += String.fromCharCode(parseInt(hex.substr(i, 2), 16));
    return str;
}

OrviboEmulator.prototype.intToHex = function(int) {
	return int.toString(16)
}

OrviboEmulator.prototype.strToHex = function (str) {
	str = new Buffer(str);
	return str.toString('hex');
}

module.exports = OrviboEmulator; // And make every OrviboSocket function available to whatever file wishes to use it. 