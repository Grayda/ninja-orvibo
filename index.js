var util = require('util')
  , stream = require('stream')
  , configHandlers = require('./lib/config-handlers')
  , OrviboSocket = require("./lib/socket.js");

// Give our driver a stream interface
util.inherits(myDriver,stream);

// Our greeting to the user.
var HELLO_WORLD_ANNOUNCEMENT = {
  "contents": [
    { "type": "heading",      "text": "Orvibo Socket Driver Loaded" },
    { "type": "paragraph",    "text": "The Orvibo Socket driver has been loaded and is now scanning for sockets.." }
  ]
};

var orvibo = new OrviboSocket(); // The main class that controls our sockets
var dTimer; // A timer that repeats orvibo.discovery() until something is found. 

/**
 * Called when our client starts up
 * @constructor
 *
 * @param  {Object} opts Saved/default driver configuration
 * @param  {Object} app  The app event emitter
 * @param  {String} app.id The client serial number
 *
 * @property  {Function} save When called will save the contents of `opts`
 * @property  {Function} config Will be called when config data is received from the Ninja Platform
 *
 * @fires register - Emit this when you wish to register a device (see Device)
 * @fires config - Emit this when you wish to send config data back to the Ninja Platform
 */
function myDriver(opts,app) {

  var self = this; // When we dive into functions like .on() and others, the meaning of 'this' changes, so we set self = this so when we say self, we know what we mean

  app.on('client::up',function(){ // The client is now connected to the Ninja Platform

    // Check if we have sent an announcement before.
    // If not, send one and save the fact that we have.
    if (!opts.hasSentAnnouncement) {
      self.emit('announcement',HELLO_WORLD_ANNOUNCEMENT);
      opts.hasSentAnnouncement = true;
      self.save();
    }
	
	orvibo.on('ready', function() { // We're ready to begin looking for sockets.
		console.log("Driver prepared, discovering sockets .."); 
		dTimer = setInterval(function() { // Sometimes the data won't send right away and we have to try a few times before the packet will leave
			console.log("Trying to discover sockets ..");
			orvibo.discover();
		 }, 2000); // preparation is complete. Start discovering sockets!
		 
		 setInterval(function() { // Every minute we want to scan for new sockets
			 console.log("Discovering new sockets..");
			 orvibo.discover();
		 }, 60000);
	});
	
	orvibo.on('socketfound', function(index) { 
		clearInterval(dTimer);
		console.log("Socket found! Index is " + index + ". Subscribing .."); 
		orvibo.subscribe(); 
		orvibo.discover();
	}) // We've found a socket. Subscribe to it if we haven't already!
		
	orvibo.on('subscribed', function(index, state) { 
		console.log("Socket index " + index + " successfully subscribed. State is " + state + ". Querying ..");
		orvibo.query(); 
	}); // We've subscribed to our device. Now we need to grab its name!
	
	orvibo.on('messagereceived', function(message) {
		// console.log("MSG: " + message.toString('hex'));
	});
	
	orvibo.on('queried', function(index, name) {
		console.log("Socket " + index + " has a name. It's " + name);
		
		// Register a device
		process.nextTick(function() {
			console.log("Registering new socket ..");
		    self.emit('register', new Device(index, name, orvibo.hosts[index].macaddress, orvibo.getState(index)));
		});

	});
	
	console.log("Preparing driver ..");
	orvibo.prepare(); // Get ready to start finding sockets
  });
};

/**
 * Called when a user prompts a configuration.
 * If `rpc` is null, the user is asking for a menu of actions
 * This menu should have rpc_methods attached to them
 *
 * @param  {Object}   rpc     RPC Object
 * @param  {String}   rpc.method The method from the last payload
 * @param  {Object}   rpc.params Any input data the user provided
 * @param  {Function} cb      Used to match up requests.
 */
myDriver.prototype.config = function(rpc,cb) {

  var self = this;
  // If rpc is null, we should send the user a menu of what he/she
  // can do.
  // Otherwise, we will try action the rpc method
  if (!rpc) {
    return configHandlers.menu.call(this,cb);
  }
};



// Give our device a stream interface
util.inherits(Device,stream);

// Export it
module.exports=Device;

/**
 * Creates a new Device Object
 *
 * @property {Boolean} readable Whether the device emits data
 * @property {Boolean} writable Whether the data can be actuated
 *
 * @property {Number} G - the channel of this device
 * @property {Number} V - the vendor ID of this device
 * @property {Number} D - the device ID of this device
 *
 * @property {Function} write Called when data is received from the Ninja Platform
 *
 * @fires data - Emit this when you wish to send data to the Ninja Platform
 */
function Device(index, dName, macaddress, state) {

  var self = this;

  // This device will emit data
  this.readable = true;
  // This device can be actuated
  this.writeable = true;

  this.G = "orvibo" + macaddress; // G is a string a represents the channel. 
  this.V = 0; // 0 is Ninja Blocks' device list
  this.D = 238; // 2000 is a generic Ninja Blocks sandbox device
  this.name = dName
  this.id = index;

  process.nextTick(function() {
    this.emit('data', state);
	setInterval(function() { // We need to subscribe every so often to keep control of the socket. This code calls subscribe() every 4 minutes
		orvibo.subscribe();
	},240000);
  }.bind(this));
  
  	orvibo.on('statechanged', function(index, state) {
		// console.log("State changed for socket " + index + ". Set to: " + state);
		self.emit('data', this.id);
	});

};

/**
 * Called whenever there is data from the Ninja Platform
 * This is required if Device.writable = true
 *
 * @param  {String} data The data received
 */
Device.prototype.write = function(data) {
	console.log("Index of this write is: " + this.id + " but was " + index);
	try {
		if(orvibo.hosts[this.id].subscribed == true) {
			orvibo.setState(this.id, data);
			console.log("Data received: " + data + " ..");			
			this.emit('data', data);
		} else {
			console.log("Not subscribed. Discovering ..");
			orvibo.discover();
		}
	} catch(ex) {
		console.log("Error writing data: " + ex.message);		
	}

	
};


// Export it
module.exports = myDriver;
