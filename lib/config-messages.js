exports.menu = {
  "contents":[
    { "type": "paragraph", "text": "Welcome to the Orvibo driver. Please select an option"},
    { "type": "submit", "name": "Set up your socket", "rpc_method": "setup" }
  ]
};

exports.setup = {
	"contents": [
		{ "type": "paragraph", "text": "Please enter in the MAC address of your socket here. To find this, open the SmartPoint app on your phone or tablet, click on 'Customize' and tap on your socket. The MAC address is the first 12 characters of your UUID (e.g. ACCF22210165). Enter it with no spaces, colons, commas etc.. Do not enter the 2020202020 at the end!"},
	    { "type":"input_field_text", "field_name": "mac_address", "value": "", "label": "MAC Address", "placeholder": "ABCDEF123456", "required": true},
	    { "type": "submit", "name": "Save", "rpc_method": "save_mac" }
	]};

exports.scan = {
  "contents":[
    { "type": "paragraph", "text": "Now scanning for sockets. Please ensure that your sockets are properly set up (and can be controlled via the SmartPoint app). Please refresh this page after a few minutes to see the results of the scan"},
	{ "type":"close", "text":"Close"}
  ]
};

exports.finish = {
  "finish": true
};
