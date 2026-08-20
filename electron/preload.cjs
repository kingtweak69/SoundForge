const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('soundforgeDesktop', {
  platform: process.platform,
  isDesktop: true
});
