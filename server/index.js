import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
    methods: ['GET', 'POST'],
  },
});

// ─────────────────────────────────────────────────────────────
// Sensor simulation config
// ─────────────────────────────────────────────────────────────
const SENSOR_CONFIG = {
  temperature: {
    label: 'Temperature',
    unit: '°C',
    zone: 'Zone A-3',
    min: 20,
    max: 1200,
    base: 420,
    variance: 35,
    thresholds: { warning: 300, critical: 600 },
    drift: 0.02,       // slow upward drift to simulate fire growing
  },
  smoke: {
    label: 'Smoke Density',
    unit: 'ppm',
    zone: 'Zone B-1',
    min: 0,
    max: 100,
    base: 45,
    variance: 8,
    thresholds: { warning: 40, critical: 70 },
    drift: 0.01,
  },
  gas: {
    label: 'Gas Concentration',
    unit: '%LEL',
    zone: 'Zone A-3',
    min: 0,
    max: 100,
    base: 30,
    variance: 5,
    thresholds: { warning: 30, critical: 60 },
    drift: 0.008,
  },
  humidity: {
    label: 'Humidity',
    unit: '%RH',
    zone: 'Zone C-2',
    min: 0,
    max: 100,
    base: 35,
    variance: 3,
    thresholds: { warning: 25, critical: 15 },   // inverted: low humidity = danger
    drift: -0.005,   // drifts downward
    invertThresholds: true,
  },
};

// ─────────────────────────────────────────────────────────────
// Sensor state — keeps track of current values
// ─────────────────────────────────────────────────────────────
const sensorState = {};
for (const [key, cfg] of Object.entries(SENSOR_CONFIG)) {
  sensorState[key] = {
    value: cfg.base,
    history: Array.from({ length: 30 }, () =>
      cfg.base + (Math.random() * 2 - 1) * cfg.variance * 0.5
    ),
  };
}

// Track total uptime
let tickCount = 0;

function generateSensorReading(key) {
  const cfg = SENSOR_CONFIG[key];
  const state = sensorState[key];

  // Random walk with mean reversion + slow drift
  const meanReversion = (cfg.base - state.value) * 0.03;
  const noise = (Math.random() * 2 - 1) * cfg.variance;
  const drift = cfg.drift * cfg.base * (0.5 + Math.random());

  // Occasional spike (5% chance)
  const spike = Math.random() < 0.05
    ? (Math.random() * cfg.variance * 3 * (cfg.drift >= 0 ? 1 : -1))
    : 0;

  let newValue = state.value + meanReversion + noise + drift + spike;
  newValue = Math.max(cfg.min, Math.min(cfg.max, newValue));

  // Round appropriately
  newValue = key === 'temperature'
    ? Math.round(newValue)
    : Math.round(newValue * 10) / 10;

  // Determine status
  let status;
  if (cfg.invertThresholds) {
    // For humidity: lower = worse
    if (newValue <= cfg.thresholds.critical) status = 'critical';
    else if (newValue <= cfg.thresholds.warning) status = 'warning';
    else status = 'safe';
  } else {
    if (newValue >= cfg.thresholds.critical) status = 'critical';
    else if (newValue >= cfg.thresholds.warning) status = 'warning';
    else status = 'safe';
  }

  // Update state
  state.value = newValue;
  state.history.push(newValue);
  if (state.history.length > 60) state.history.shift(); // keep last 60 readings

  const now = new Date();

  return {
    key,
    label: cfg.label,
    unit: cfg.unit,
    zone: cfg.zone,
    value: newValue,
    max: cfg.max,
    status,
    thresholds: cfg.thresholds,
    invertThresholds: cfg.invertThresholds || false,
    history: [...state.history],
    timestamp: now.toISOString(),
    tickId: tickCount,
  };
}

function generateAllReadings() {
  tickCount++;
  const readings = {};
  for (const key of Object.keys(SENSOR_CONFIG)) {
    readings[key] = generateSensorReading(key);
  }
  return readings;
}

// ─────────────────────────────────────────────────────────────
// Alert generation
// ─────────────────────────────────────────────────────────────
let alertIdCounter = 3000;
const recentAlerts = [];

function maybeGenerateAlert(readings) {
  for (const [key, reading] of Object.entries(readings)) {
    if (reading.status === 'critical' && Math.random() < 0.3) {
      const alert = {
        id: `INC-${alertIdCounter++}`,
        sensorKey: key,
        label: reading.label,
        zone: reading.zone,
        value: reading.value,
        unit: reading.unit,
        status: reading.status,
        severity: 'CRITICAL',
        timestamp: reading.timestamp,
        message: `${reading.label} at ${reading.value}${reading.unit} in ${reading.zone} — exceeds critical threshold`,
      };
      recentAlerts.unshift(alert);
      if (recentAlerts.length > 20) recentAlerts.pop();
      return alert;
    }
    if (reading.status === 'warning' && Math.random() < 0.1) {
      const alert = {
        id: `INC-${alertIdCounter++}`,
        sensorKey: key,
        label: reading.label,
        zone: reading.zone,
        value: reading.value,
        unit: reading.unit,
        status: reading.status,
        severity: 'WARNING',
        timestamp: reading.timestamp,
        message: `${reading.label} at ${reading.value}${reading.unit} in ${reading.zone} — warning threshold`,
      };
      recentAlerts.unshift(alert);
      if (recentAlerts.length > 20) recentAlerts.pop();
      return alert;
    }
  }
  return null;
}

// ─────────────────────────────────────────────────────────────
// Socket.IO connection handling
// ─────────────────────────────────────────────────────────────
let connectedClients = 0;

io.on('connection', (socket) => {
  connectedClients++;
  console.log(`[SENTINEL] Client connected: ${socket.id} (${connectedClients} active)`);

  // Send initial state immediately
  const initialReadings = generateAllReadings();
  socket.emit('sensor:initial', {
    sensors: initialReadings,
    serverTime: new Date().toISOString(),
    connectedClients,
  });

  // Send recent alerts history
  socket.emit('alerts:history', recentAlerts);

  socket.on('disconnect', (reason) => {
    connectedClients--;
    console.log(`[SENTINEL] Client disconnected: ${socket.id} (${reason}). ${connectedClients} active`);
  });

  // Client can request a manual refresh
  socket.on('sensor:request', () => {
    const readings = generateAllReadings();
    socket.emit('sensor:update', {
      sensors: readings,
      serverTime: new Date().toISOString(),
    });
  });
});

// ─────────────────────────────────────────────────────────────
// Broadcast loop — every 2 seconds
// ─────────────────────────────────────────────────────────────
setInterval(() => {
  const readings = generateAllReadings();
  io.emit('sensor:update', {
    sensors: readings,
    serverTime: new Date().toISOString(),
  });

  // Maybe fire an alert
  const alert = maybeGenerateAlert(readings);
  if (alert) {
    io.emit('alert:new', alert);
    console.log(`[ALERT] ${alert.severity}: ${alert.message}`);
  }
}, 2000);

// ─────────────────────────────────────────────────────────────
// Health endpoint
// ─────────────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    uptime: process.uptime(),
    connectedClients,
    tickCount,
  });
});

// ─────────────────────────────────────────────────────────────
// Start server
// ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`\n╔══════════════════════════════════════════════════╗`);
  console.log(`║  🔥 SENTINEL FIRE AI — Backend Server            ║`);
  console.log(`║  📡 Socket.IO running on port ${PORT}               ║`);
  console.log(`║  🌐 CORS: http://localhost:5173                   ║`);
  console.log(`║  📊 Sensors broadcasting every 2 seconds          ║`);
  console.log(`╚══════════════════════════════════════════════════╝\n`);
});
