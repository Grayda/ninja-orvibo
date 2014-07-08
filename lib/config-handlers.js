var configMessages = require('./config-messages'); // This JS file contains our menu options. They're JSON objects
var orvibo = require("./socket"); // Require our socket file that does the heavy lifting for the Orvibo smart socket

/**
 * Called from the driver's config method when a
 * user wants to see a menu to configure the driver
 * @param  {Function} cb Callback to send a response back to the user
 */
exports.menu = function(cb) { 
  cb(null,configMessages.menu); // This is shown if we're opening the config page (i.e. rpc is null. See index.js)
};

/**
 * Called when a user clicks the 'Save' button after entering their MAC address
 * button we sent in the menu request
 * @param  {Object}   params Parameter object
 * @param  {Function} cb     Callback to send back to the user
 */
exports.save_mac = function(params,cb) { // When we click "Save", shove our MAC address into our config.json file in ../../config/ninja-orvibo/config.json
	
	macAddr = strToHex(params.mac_address);
    this._opts.mac_address.push(macAddr);
    this.save();
	
	orvibo.mac_address = macAddr;
	orvibo.discover();
	
    cb(null,messages.finish);
};

function strToHex(str) {
	var arr = [];
	for (var i = 0, l = str.length; i < l; i += 2) {
		arr.push("0x" + str.substr(i, 2));	
	}
	return arr;
}