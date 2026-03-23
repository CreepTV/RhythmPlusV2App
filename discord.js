let DiscordRPC;
try {
  DiscordRPC = require('discord-rpc');
} catch (e) {
  // discord-rpc not available
}

let CLIENT_ID = '';
try {
  CLIENT_ID = require('./discord.config.json').clientId;
} catch (e) {
  // No discord.config.json – Rich Presence disabled
}

let client = null;
let startTimestamp = null;
let pendingDetails = 'Rhythm+';
let pendingSongId = null;
let reconnecting = false;
let onJoinCallback = null;

function connect() {
  if (!DiscordRPC || !CLIENT_ID || reconnecting) return;

  reconnecting = true;
  client = new DiscordRPC.Client({ transport: 'ipc' });

  client.on('ready', () => {
    reconnecting = false;
    startTimestamp = startTimestamp || new Date();
    console.log('[Discord] RPC verbunden, User:', client.user?.username);
    setActivity(pendingDetails, pendingSongId);

    // When another user accepts "Ask to Join" → their app receives the songId
    client.subscribe('ACTIVITY_JOIN', ({ secret }) => {
      if (onJoinCallback && secret) onJoinCallback(secret);
    }).catch(() => {});
  });

  client.on('disconnected', () => {
    client = null;
    reconnecting = false;
    setTimeout(connect, 10000);
  });

  client.login({ clientId: CLIENT_ID }).catch(() => {
    client = null;
    reconnecting = false;
    setTimeout(connect, 15000);
  });
}

function setActivity(details, songId) {
  pendingDetails = details || 'Rhythm+';
  pendingSongId = songId || null;
  if (!client) return;

  const activity = {
    details: pendingDetails,
    state: 'v2.rhythm-plus.com',
    timestamps: startTimestamp ? { start: Math.round(startTimestamp.getTime() / 1000) } : undefined,
    assets: {
      large_image: 'logo',
      large_text: 'Rhythm+',
    },
    instance: false,
  };

  if (pendingSongId) {
    activity.buttons = [
      { label: 'Song spielen', url: `https://v2.rhythm-plus.com/?songId=${pendingSongId}` },
    ];
    console.log('[Discord] Button gesetzt für Song:', pendingSongId);
  }

  // Bypass setActivity() – it strips unknown fields like buttons.
  // Use request() directly to send the raw SET_ACTIVITY command.
  client.request('SET_ACTIVITY', { pid: process.pid, activity })
    .then(() => console.log('[Discord] Activity gesetzt:', activity.details))
    .catch((e) => console.error('[Discord] Fehler:', e.message));
}

function setJoinCallback(cb) {
  onJoinCallback = cb;
}

function destroy() {
  if (client) {
    client.destroy().catch(() => {});
    client = null;
  }
}

module.exports = { connect, setActivity, destroy, setJoinCallback };
