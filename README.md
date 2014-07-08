ninja-orvibo
============

A driver for the Ninja Blocks that controls Orvibo Wi-Fi Smart Sockets

Please note: This code is so Alpha, not even hipsters would touch it. I strongly encourage people to submit fixes and fork the project.

At this time, you can only control one socket, but you can control it via the dashboard or the rules page. 

Getting started
===============

To install this driver, SSH into your block, go to the location of your Ninja Block drivers (on Raspbian, this will be /opt/ninjablocks/block-client/drivers/) and run:

`git clone http://github.com/Grayda/ninja-orvibo && cd ninja-orvibo && npm install && restartninja`

To-Do:
======

* ~~Actually get this to run~~
* Make it more robust so it doesn't accidentally detect the SmartPoint app as a socket (a bug in the SP app, perhaps?)
* Fix up the options so you can modify the settings instead of it recreating them each time
* Maybe: Make this a truly automatic setup. Set it up in the SP app, then the Ninja driver will detect the MAC address and stuff
* Rewrite parts (most?) of this code so you can control more than one socket. Pull requests DEFINITELY welcome on this part!
* 

Thanks to:
==========

* Nozza87 on the Ninja Blocks forum for taking my basic code and making it run, and for doing the hard work in reverse-engineering the protocol, and to mlava for initial research on the manufacturer, plus data sheets of the socket 
