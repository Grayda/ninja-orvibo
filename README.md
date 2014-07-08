ninja-orvibo
============

A driver for the Ninja Blocks that controls Orvibo Wi-Fi Smart Sockets

Please note: This code is so Alpha, not even hipsters would touch it. I strongly encourage people to submit fixes and fork the project.

At this time, the code runs test.js without crashing, but you can't actually control the sockets. The setting of options in the Ninja Dashboard is almost 100% certain to be broken, but will be fixed.

Getting started
===============

Open package.json and change mac_address to the MAC address of your socket. You can get this from your router or you can get this from your SmartPoint App under Customization > (Tap your socket's name) > The first 12 characters of your UUID

To-Do:
======

* Actually get this to run
* Make it more robust so it doesn't accidentally detect the SmartPoint app as a socket (a bug in the SP app, perhaps?)
* Get the options working
* Maybe: Make this a truly automatic setup. Set it up in the SP app, then the Ninja driver will detect the MAC address and stuff
