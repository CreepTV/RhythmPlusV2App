// preload.js - runs in the renderer before the page loads
// contextIsolation is enabled, so this is sandboxed safely

const { contextBridge } = require('electron');

// Expose a minimal API to the renderer if ever needed
contextBridge.exposeInMainWorld('electronApp', {
  platform: process.platform,
});
