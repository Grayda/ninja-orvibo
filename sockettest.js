var PORT = 10000; // The port we're working with
var HOST = ''; // The address of our socket taken from discovery reply
var macAddress = ['0xac','0xcf','0x23','0x24','0x09','0x56']; // Our MAC address. Needed to do stuff with the socket
var macReversed = macAddress.slice().reverse(); // Copy MAC address to a new var so it doesn't get changed. then Reverse MAC address. Needed to 'subscribe' to the socket
var twenties = ['0x20', '0x20', '0x20', '0x20', '0x20', '0x20']; // This appears at the end of a few packets we send, so put it here for shortness of code
var payload = []; // The payload we're going to send
 
var dgram = require('dgram'); // UDP support
 
var server = dgram.createSocket('udp4'); // For receiving data
server.bind(PORT); // Listen on port 10000
 
var client = dgram.createSocket('udp4'); // For sending data
 
var localIP = getBroadcastAddress();
var broadcastip = localIP.substr(0,localIP.lastIndexOf('.')) + ".255";
 
function discover() {
    console.log('* DISCOVER')
    payload = [];
    payload = payload.concat(['0x68', '0x64', '0x00', '0x12', '0x71', '0x67'], macAddress, twenties); // Address discovery
    sendMessage(payload, broadcastip); // Send it!
}
 
function subscribe() {
    console.log('* SUBSCRIBE')
    payload = [];
    payload = payload.concat(['0x68', '0x64', '0x00', '0x1e', '0x63', '0x6c'], macAddress, twenties, macReversed, twenties); // Subscribe
    sendMessage(payload, HOST);
    setTimeout(on, 2000);
    setTimeout(off, 4000);
}
 
function on() {
    console.log('* TURN ON')
    payload = [];
    payload = payload.concat(['0x68', '0x64', '0x00', '0x17', '0x64', '0x63'], macAddress, twenties, ['0x00', '0x00', '0x00', '0x00', '0x01']); // ON
    sendMessage(payload, HOST);
}
 
function off() {
    console.log('* TURN OFF')
    payload = [];
    payload = payload.concat(['0x68', '0x64', '0x00', '0x17', '0x64', '0x63'], macAddress, twenties, ['0x00', '0x00', '0x00', '0x00', '0x00']); // OFF
    sendMessage(payload, HOST);
}
 
discover(); //This is only needed if you do NOT know the IP address.
 
function sendMessage(message, HOST) {
    //console.log('Send Message of length: ' + message.length + ' to ' + HOST + ':' + PORT);
    message = new Buffer(message);
   
    client.send(message, 0, message.length, PORT, HOST, function(err, bytes) {
        if (err) throw err;
        console.log(' - Message sent');
 
    });
}
       
server.on('message', function (message, remote) {
    if (remote.address != localIP) { //Check message isn't from me.
        //console.log('Recieved Message of length: ' + message.length + ' from ' + remote.address + ':' + remote.port);
       
         var MessageHex = a2hex(message.toString())
         
         if (MessageHex.substr(0,12) == '686400177366') { //Check for power status command
            switch(MessageHex.substr(MessageHex.length - 1,1)) {
                case '0':
                    console.log('* POWER STATUS: OFF');
                    break;
                case '1':
                    console.log('* POWER STATUS: ON');
                    break;
                default:
                    console.log('* POWER STATUS: UNKNOWN');
                    break;
            }
           
         }
       
        if (HOST == '') { //First message received so save its IP address
            console.log(' - Found HOST at ' + remote.address);
            HOST = remote.address;
            subscribe();
        }
    }
});
 
function getBroadcastAddress() {
    var interfaces = require('os').networkInterfaces();
    for (var devName in interfaces) {
        var iface = interfaces[devName];
 
        for (var i = 0; i < iface.length; i++) {
            var alias = iface[i];
            if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal) {
                return alias.address;
            }
        }
    }
    return '0.0.0.0';
}
 
function a2hex(str) {
    var arr = [];
    for (var i = 0, l = str.length; i < l; i ++) {
        var hex = Number(str.charCodeAt(i)).toString(16);
        if (hex.length == 1) {
            hex = "0" + hex;
        }
        arr.push(hex);
    }
    return arr.join('');
}