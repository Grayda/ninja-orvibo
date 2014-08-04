var OrviboEmulator = require("../emulator");
var o = new OrviboEmulator();

/* To add new sockets, copy and paste this line and change as necessary */
o.hosts.push({ index: 1, remote: '', ready: false, macAddress: "accfdeadbeef", macReversed: "efbeaddecfac", name: "Dead Beef", state: "00"  });

var readline = require('readline'),
rl = readline.createInterface(process.stdin, process.stdout);

console.log("List of sockets to be created:");
console.dir(o.hosts);

o.prepare();
count = o.hosts.length - 1;
rl.setPrompt('Enter an index to toggle (0 to ' + count.toString() + ")");
rl.prompt();
rl.on('line', function(line) {
	try {
		if(line == "status") { 
			console.log("State of sockets:");
			console.dir(o.hosts); 
		} else {
			o.setState(parseInt(line), o.hosts[parseInt(line)].state == "00" ? "01" : "00");
		}
	} catch(ex) {
		console.log("Error setting state. Error was: " + ex);	
	}
	
	rl.prompt();
  });
  
o.on('data', function(data, ip) {
	console.log("Data received: " + data.toString('hex') + " from " + ip.address); 
});
  
o.on('sent', function(data, ip) {
	console.log("Data SENT: " + data.toString('hex') + " to " + ip); 
});