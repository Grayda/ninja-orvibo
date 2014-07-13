var configMessages = require('./config-messages'); // This JS file contains our menu options. They're JSON objects
var fs = require('fs');

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

    cb(null,messages.finish);
};

function strToHex(str) {
	var arr = [];
	for (var i = 0, l = str.length; i < l; i += 2) {
		arr.push("0x" + str.substr(i, 2));	
	}
	return arr;
}