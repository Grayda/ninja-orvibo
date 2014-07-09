exports.menu = {
	"contents": [
		{ "type": "paragraph", "text": "Please enter in the MAC address of your socket here. To find this, open the SmartPoint app on your phone or tablet, click on 'Customize' and tap on your socket. The MAC address is the first 12 characters of your UUID (e.g. ACCF22210165). Enter it with no spaces, colons, commas etc.. Do not enter the 2020202020 at the end!"},
	    { "type":"input_field_text", "field_name": "mac_address", "value": "", "label": "MAC Address", "placeholder": "ABCDEF123456", "required": true},
	    { "type": "submit", "name": "Save", "rpc_method": "save_mac" }
	]};

exports.finish = {
  "finish": true
};
