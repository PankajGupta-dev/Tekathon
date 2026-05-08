import { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

const SOCKET_URL = 'http://localhost:3001';
const AI_SOCKET_URL = import.meta.env.VITE_AI_SERVER_URL || 'http://localhost:5001';

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [aiSocket, setAiSocket] = useState(null);
  
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [aiConnectionStatus, setAiConnectionStatus] = useState('connecting');
  
  const [sensorData, setSensorData] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [serverTime, setServerTime] = useState(null);
  const [latency, setLatency] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  const [aiData, setAiData] = useState({
    detections: [],
    confidence: 0,
    severity: 0,
    inference_time: 0,
    fps: 0,
    model: 'YOLOv8 nano',
    health: 'OFFLINE'
  });

  const reconnectAttempts = useRef(0);
  const lastPingTime = useRef(null);

  useEffect(() => {
    // ─── Main Sensor Socket ───
    const socketInstance = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
    });

    socketInstance.on('connect', () => {
      console.log('[SENTINEL-WS] Connected:', socketInstance.id);
      setConnectionStatus('connected');
      reconnectAttempts.current = 0;
      lastPingTime.current = Date.now();
      socketInstance.emit('sensor:request');
    });

    socketInstance.on('disconnect', (reason) => {
      console.log('[SENTINEL-WS] Disconnected:', reason);
      setConnectionStatus('disconnected');
    });

    socketInstance.on('connect_error', (err) => {
      console.warn('[SENTINEL-WS] Connection error:', err.message);
      reconnectAttempts.current++;
      setConnectionStatus('error');
    });

    socketInstance.io.on('reconnect_attempt', (attempt) => {
      setConnectionStatus('connecting');
    });

    socketInstance.io.on('reconnect', () => {
      setConnectionStatus('connected');
    });

    socketInstance.on('sensor:initial', (data) => {
      setSensorData(data.sensors);
      setServerTime(data.serverTime);
      setIsLoading(false);
      if (lastPingTime.current) {
        setLatency(Date.now() - lastPingTime.current);
      }
    });

    socketInstance.on('sensor:update', (data) => {
      setSensorData(data.sensors);
      setServerTime(data.serverTime);
      setIsLoading(false);
      setLatency(prev => Math.max(1, (prev || 15) + Math.floor(Math.random() * 6) - 3));
    });

    socketInstance.on('alert:new', (alert) => {
      setAlerts(prev => [alert, ...prev].slice(0, 50));
    });

    socketInstance.on('alerts:history', (history) => {
      setAlerts(history);
    });

    setSocket(socketInstance);

    // ─── AI Socket ───
    const aiSocketInstance = io(AI_SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });

    aiSocketInstance.on('connect', () => {
      console.log('[AI-WS] Connected:', aiSocketInstance.id);
      setAiConnectionStatus('connected');
    });

    aiSocketInstance.on('disconnect', () => {
      setAiConnectionStatus('disconnected');
      setAiData(prev => ({ ...prev, health: 'OFFLINE' }));
    });

    aiSocketInstance.on('connect_error', () => {
      setAiConnectionStatus('error');
      setAiData(prev => ({ ...prev, health: 'ERROR' }));
    });

    aiSocketInstance.on('ai:update', (data) => {
      setAiData(data);
    });

    setAiSocket(aiSocketInstance);

    return () => {
      socketInstance.disconnect();
      aiSocketInstance.disconnect();
    };
  }, []);

  const requestRefresh = useCallback(() => {
    if (socket?.connected) {
      lastPingTime.current = Date.now();
      socket.emit('sensor:request');
    }
  }, [socket]);

  const value = {
    socket,
    connectionStatus,
    sensorData,
    alerts,
    serverTime,
    latency,
    isLoading,
    requestRefresh,
    reconnectAttempts: reconnectAttempts.current,
    
    // AI data
    aiSocket,
    aiConnectionStatus,
    aiData,
  };

  return (
    <SocketContext.Provider value={value}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  const ctx = useContext(SocketContext);
  if (!ctx) throw new Error('useSocket must be used within SocketProvider');
  return ctx;
}

export function useSensor(sensorKey) {
  const { sensorData, isLoading, connectionStatus } = useSocket();
  const data = sensorData?.[sensorKey] || null;
  return { data, isLoading: isLoading || !data, connectionStatus };
}
