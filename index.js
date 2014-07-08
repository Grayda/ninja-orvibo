var Device = require('./lib/device')
  , orvibo = require("./lib/socket.js")
  , util = require('util')
  , stream = require('stream')
  , configHandlers = require('./lib/config-handlers');

// Give our driver a stream interface
util.inherits(myDriver,stream);

// Displayed when the driver is first installed.
var HELLO_WORLD_ANNOUNCEMENT = {
  "contents": [
    { "type": "heading",      "text": "Orvibo Driver Loaded" },
    { "type": "paragraph",    "text": "The Orvibo Wi-Fi smart socket driver has been loaded. This driver needs to be configured before it can be used!" }
  ]
};

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

  app.on('client::up',function(){

    // The client is now connected to the Ninja Platform

    // Check if we have sent an announcement before.
    // If not, send one and save the fact that we have.
    if (!opts.hasSentAnnouncement) {
      self.emit('announcement',HELLO_WORLD_ANNOUNCEMENT);
      opts.hasSentAnnouncement = true;
      self.save();
    }
	if ( typeof opts.mac_address !== 'undefined' && opts.mac_address ) {
		console.log("mac_address found in options. On we go!");
		if(opts.mac_address.length > 0) { // If we've previously set a MAC address
			orvibo.setMacAddress(opts.mac_address); // Pass it to our socket file
			console.log("Set mac_address for orvibo class. Discovering..");
			orvibo.discover(); // Then discover the IP address.
			console.log("Discovery complete?");
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




// Export it
module.exports = myDriver;