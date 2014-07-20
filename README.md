ninja-orvibo
============

A driver for the Ninja Blocks that controls Orvibo Wi-Fi Smart Sockets. 

Getting started
===============

To install this driver, SSH into your block, go to the location of your Ninja Block drivers (on Raspbian, this will be /opt/ninjablocks/block-client/drivers/) and run:

`git clone http://github.com/Grayda/ninja-orvibo && cd ninja-orvibo && npm install && restartninja`

Refresh your dashboard page and after a few seconds, any detected sockets should appear on the page. New sockets are auto-discovered every minute

Feedback
========

This is a beta driver. It has been built and tested against the smart socket by Bauhn (which is the Orvibo S10 smart socket, I believe). I'm looking for people who have different types of Orvibo Wi-Fi smart sockets to test this and report back. Packet captures (via TCPdump or Wireshark) definitely most welcome

To-Do:
======

* Test this with more than one socket
* ~~Actually get this to run~~
* ~~Make it more robust so it doesn't accidentally detect the SmartPoint app as a socket (a bug in the SP app, perhaps?)~~
* ~~Fix up the options so you can modify the settings instead of it recreating them each time~~ No longer needed
* ~~Maybe: Make this a truly automatic setup. Set it up in the SP app, then the Ninja driver will detect the MAC address and stuff~~
* ~~Rewrite parts (most?) of this code so you can control more than one socket. Pull requests DEFINITELY welcome on this part!~~
* ~~Add the ability to read the state of the device without turning it on or off~~
* ~~Modify sockettest.js to provide more details about the socket and where stuff is failing~~

Thanks to:
==========

* Nozza87 on the Ninja Blocks forum for taking my basic code and making it run, and for doing the hard work in reverse-engineering the protocol
* mlava for initial research on the manufacturer, plus data sheets of the socket 
* dsrc12 for testing this driver and providing valuable feedback and feature suggestions

Supporting development
======================

I was born and raised on the open source software movement. If you like what I do, consider donating code, hardware or a few bucks to cover costs. PayPal donations welcome at grayda [a@t] solidinc [dot.org], code forks and pull requests most welcome and if you have an Orvibo S20 / WIWO socket, please try this code and donate Wireshark files if you can 
