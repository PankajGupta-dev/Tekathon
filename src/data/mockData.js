// Mock data for Sentinel Fire AI Command Center

export const MOCK_SENSORS = {
  temperature: { value: 847, unit: '°C', max: 1200, label: 'Temperature', status: 'critical', zone: 'Zone A-3' },
  smoke: { value: 76, unit: 'ppm', max: 100, label: 'Smoke Density', status: 'warning', zone: 'Zone B-1' },
  gas: { value: 43, unit: '%LEL', max: 100, label: 'Gas Concentration', status: 'warning', zone: 'Zone A-3' },
  humidity: { value: 18, unit: '%RH', max: 100, label: 'Humidity', status: 'low', zone: 'Zone C-2' },
};

export const MOCK_INCIDENTS = [
  { id: 'INC-2847', time: '16:52:01', location: 'Building A, Floor 3', severity: 'CRITICAL', type: 'FIRE', confidence: 97.3, status: 'ACTIVE' },
  { id: 'INC-2846', time: '16:48:33', location: 'Warehouse B, Section 2', severity: 'HIGH', type: 'SMOKE', confidence: 89.1, status: 'RESPONDING' },
  { id: 'INC-2845', time: '16:41:15', location: 'Server Room C', severity: 'MEDIUM', type: 'HEAT', confidence: 74.8, status: 'MONITORED' },
  { id: 'INC-2844', time: '16:35:52', location: 'Parking Lot D', severity: 'LOW', type: 'GAS', confidence: 62.2, status: 'RESOLVED' },
  { id: 'INC-2843', time: '16:28:07', location: 'Rooftop Solar Array', severity: 'HIGH', type: 'FIRE', confidence: 91.5, status: 'RESOLVED' },
];

export const MOCK_TIMELINE = [
  { time: '16:52:01', event: 'AI Detection: Fire confirmed in Zone A-3', type: 'critical', icon: '🔥' },
  { time: '16:51:47', event: 'Smoke sensor threshold exceeded — Zone A-3', type: 'warning', icon: '💨' },
  { time: '16:50:22', event: 'Emergency Protocol ALPHA activated', type: 'alert', icon: '🚨' },
  { time: '16:49:55', event: 'Suppression system armed — Standby', type: 'info', icon: '💧' },
  { time: '16:48:33', event: 'Fire unit dispatched: Unit-7, Unit-12', type: 'info', icon: '🚒' },
  { time: '16:47:11', event: 'Building evacuation initiated — All zones', type: 'alert', icon: '🏃' },
  { time: '16:45:03', event: 'Camera feed: Thermal anomaly detected', type: 'warning', icon: '📷' },
  { time: '16:42:38', event: 'Blockchain log verified — Block #48291', type: 'info', icon: '⛓️' },
];

export const MOCK_BLOCKCHAIN_LOGS = [
  { block: '0x7f3a...c81d', hash: '0xa4b2f3d8e912c7', timestamp: '16:52:01', action: 'INCIDENT_RECORDED', status: 'VERIFIED' },
  { block: '0x7f3a...c81c', hash: '0x9d1e8a7f3b65c2', timestamp: '16:51:47', action: 'SENSOR_ALERT_LOGGED', status: 'VERIFIED' },
  { block: '0x7f3a...c81b', hash: '0x8c3d2f1e9a74b5', timestamp: '16:50:22', action: 'PROTOCOL_ACTIVATED', status: 'VERIFIED' },
  { block: '0x7f3a...c81a', hash: '0x7b4e1c2d8f63a9', timestamp: '16:49:55', action: 'SUPPRESSION_ARMED', status: 'PENDING' },
  { block: '0x7f3a...c819', hash: '0x6a5f0b3e7c52d8', timestamp: '16:48:33', action: 'DISPATCH_LOGGED', status: 'VERIFIED' },
];

export const MOCK_CAMERA_ZONES = [
  { id: 'CAM-01', label: 'Zone A-3 | Floor 3', status: 'FIRE', active: true },
  { id: 'CAM-02', label: 'Zone B-1 | Warehouse', status: 'SMOKE', active: false },
  { id: 'CAM-03', label: 'Zone C-2 | Parking', status: 'CLEAR', active: false },
  { id: 'CAM-04', label: 'Zone D-0 | Rooftop', status: 'CLEAR', active: false },
];

export const MOCK_AI_DETECTIONS = [
  { label: 'FIRE SOURCE', x: '28%', y: '35%', w: '22%', h: '28%', confidence: 97.3 },
  { label: 'SMOKE PLUME', x: '52%', y: '20%', w: '30%', h: '40%', confidence: 82.1 },
];

export const SEVERITY_COLORS = {
  CRITICAL: { text: '#FF4D4D', bg: 'rgba(255,77,77,0.15)', border: 'rgba(255,77,77,0.5)' },
  HIGH: { text: '#FF8A00', bg: 'rgba(255,138,0,0.15)', border: 'rgba(255,138,0,0.5)' },
  MEDIUM: { text: '#FFD700', bg: 'rgba(255,215,0,0.15)', border: 'rgba(255,215,0,0.5)' },
  LOW: { text: '#00D1FF', bg: 'rgba(0,209,255,0.15)', border: 'rgba(0,209,255,0.4)' },
};

export const STATUS_COLORS = {
  ACTIVE: '#FF4D4D',
  RESPONDING: '#FF8A00',
  MONITORED: '#FFD700',
  RESOLVED: '#00FF87',
};
