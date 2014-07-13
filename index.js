var util = require('util') // Used to get emit() to work
  , stream = require('stream')
  , configHandlers = require('./lib/config-handlers') // The code that handles the setup of our socket (e.g. save_mac etc.)
  , OrviboSocket = require("./lib/socket.js"); // The meat of our driver -- the driver that runs the socket!

// Give our driver a stream interface
util.inherits(myDriver,stream);

// Displayed when the driver is first installed.
var HELLO_WORLD_ANNOUNCEMENT = {
  "contents": [
    { "type": "heading",      "text": "Orvibo Driver Loaded" },
    { "type": "paragraph",    "text": "The Orvibo Wi-Fi smart socket driver has been loaded. This driver needs to be configured before it can be used!" }
  ]
};

var orvibo = new OrviboSocket(); // A new instance of our socket library
var dTimer; // This var is used to retry our discovery packet if no sockets were discovered first time round (it can happen due to some funny business with node, dgrams and my sendMessage code

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

  var self = this;
  this._opts = opts;

  app.on('client::up',function(){
	orvibo.prepare();
    // The client is now connected to the Ninja Platform

    // Check if we have sent an announcement before.
    // If not, send one and save the fact that we have.
    if (!opts.hasSentAnnouncement) {
      self.emit('announcement',HELLO_WORLD_ANNOUNCEMENT);
      opts.hasSentAnnouncement = true;
      self.save();
    }
	
	if ( typeof opts.mac_address !== 'undefined' && opts.mac_address ) { // If we've set a MAC address previously..
		if(opts.mac_address.length > 0) { // Check if we really have
			orvibo.setMacAddress(opts.mac_address); // Pass it to our socket file
			console.log("Set mac_address for orvibo class. Discovering..");
			dTimer = setInterval(orvibo.discover, 1000); // Then discover the IP address of our socket
		}
	}

    // Register a device
    self.emit('register', new Device());
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
  else if (typeof configHandlers[rpc.method] === "function") {
    return configHandlers[rpc.method].call(this,rpc.params,cb);
  }
  else {
    return cb(true);
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
function Device() {

  var self = this;

  // This device will emit data
  this.readable = true;
  // This device can be actuated
  this.writeable = true;

  this.G = "orvibo"; // G is a string a represents the channel
  this.V = 0; // 0 is Ninja Blocks' device list
  this.D = 238; // 235 is a relay device
  this.name = "Orvibo Wi-Fi Smart Socket";

  orvibo.on("discovering", function() {
  
  });
  orvibo.on("hostfound", function(host) { // If we've discovered a socket
	  clearInterval(dTimer);
	  orvibo.subscribe(); // Subscribe to it!	
  });
  
  orvibo.on("subscribed", function(state) { // We've successfully subscribed to the scoket
	  this.emit('data', state); // Because our subscription packet has our current state (00 = off, 01 = on) we emit that now				
	  orvibo.query(); // Query our device				
  }.bind(this));
  
  orvibo.on("statechanged", function(state) {
	  this.emit('data', state);
  }.bind(this));
			  
  orvibo.on("deviceinfo", function(name) { // We've queried our socket for a name and got something back!
	  this.name = name;
  }.bind(this));
};

/**
 * Called whenever there is data from the Ninja Platform
 * This is required if Device.writable = true
 *
 * @param  {String} data The data received
 */
Device.prototype.write = function(data) {

	if(orvibo.isReady() == true) {
		orvibo.setState(data);
		this.emit('data', data);
	} else {
		orvibo.discover();
	}
};





// Export it
module.exports = myDriver;
