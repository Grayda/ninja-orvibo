var OrviboEmulator = require("../emulator");
var o = new OrviboEmulator();

o.hosts.push({ index: 0, macAddress: "accfabcdef12", macReversed: "12efcdabcfac", name: "Test Socket 1", state: "01" });
o.hosts.push({ index: 1, macAddress: "accfdeadbeef", macReversed: "efbeaddecfac", name: "Dead Beef", state: "00"  });
o.hosts.push({ index: 2, macAddress: "accf12345678", macReversed: "78563412cfac", name: "Numbers Station", state: "01"  });
o.hosts.push({ index: 2, macAddress: "accffadedcab", macReversed: "abdcdefacfac", name: "Faded Cab", state: "00"  });
console.dir(o.hosts);
o.prepare();
