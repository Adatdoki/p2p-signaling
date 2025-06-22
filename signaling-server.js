
const WebSocket = require('ws');
const wss = new WebSocket.Server({ port: process.env.PORT || 3001 });
const clients = {};

wss.on('connection', ws => {
  ws.on('message', msg => {
    const data = JSON.parse(msg);
    clients[data.id] = clients[data.id] || [];
    if (!clients[data.id].includes(ws)) clients[data.id].push(ws);
    clients[data.id].forEach(c => {
      if (c !== ws && c.readyState === WebSocket.OPEN) c.send(msg);
    });
  });

  ws.on('close', () => {
    for (const id in clients) {
      clients[id] = clients[id].filter(c => c !== ws);
    }
  });
});
