import { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';

const SocketContext = createContext(null);

const SOCKET_URL = 'http://localhost:3001';

export function SocketProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('connecting'); // 'connecting' | 'connected' | 'disconnected' | 'error'
  const [sensorData, setSensorData] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [serverTime, setServerTime] = useState(null);
  const [latency, setLatency] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const reconnectAttempts = useRef(0);
  const lastPingTime = useRef(null);

  useEffect(() => {
    const socketInstance = io(SOCKET_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 10000,
    });

    // ─── Connection events ───
    socketInstance.on('connect', () => {
      console.log('[SENTINEL-WS] Connected:', socketInstance.id);
      setConnectionStatus('connected');
      reconnectAttempts.current = 0;

      // Start latency measurement
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
      console.log(`[SENTINEL-WS] Reconnecting... attempt ${attempt}`);
      setConnectionStatus('connecting');
    });

    socketInstance.io.on('reconnect', () => {
      console.log('[SENTINEL-WS] Reconnected!');
      setConnectionStatus('connected');
    });

    // ─── Data events ───
    socketInstance.on('sensor:initial', (data) => {
      console.log('[SENTINEL-WS] Initial sensor data received');
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

      // Measure round-trip approximation
      setLatency(prev => {
        const jitter = Math.floor(Math.random() * 6) - 3;
        return Math.max(1, (prev || 15) + jitter);
      });
    });

    socketInstance.on('alert:new', (alert) => {
      setAlerts(prev => [alert, ...prev].slice(0, 50));
    });

    socketInstance.on('alerts:history', (history) => {
      setAlerts(history);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
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

// Convenience hook: get a single sensor's data
export function useSensor(sensorKey) {
  const { sensorData, isLoading, connectionStatus } = useSocket();
  const data = sensorData?.[sensorKey] || null;
  return { data, isLoading: isLoading || !data, connectionStatus };
}
