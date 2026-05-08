import { useState, useEffect, useRef } from 'react';

// Hook: Live clock
export function useClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  return time;
}

// Hook: Animate number to target value
export function useAnimatedValue(targetValue, duration = 1000) {
  const [current, setCurrent] = useState(0);
  const frame = useRef(null);
  useEffect(() => {
    const start = performance.now();
    const from = current;
    const to = targetValue;
    const animate = (now) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(from + (to - from) * eased);
      if (progress < 1) frame.current = requestAnimationFrame(animate);
    };
    frame.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame.current);
  }, [targetValue]); // eslint-disable-line
  return current;
}

// Hook: Sensor value fluctuation simulation
export function useFluctuatingSensor(baseValue, variance = 0.05, intervalMs = 2000) {
  const [value, setValue] = useState(baseValue);
  useEffect(() => {
    const id = setInterval(() => {
      const delta = (Math.random() * 2 - 1) * variance * baseValue;
      setValue(prev => Math.max(0, Math.min(baseValue * 1.1, prev + delta)));
    }, intervalMs);
    return () => clearInterval(id);
  }, [baseValue, variance, intervalMs]);
  return value;
}

// Hook: Alert counter
export function useAlertCounter(initial = 3) {
  const [count, setCount] = useState(initial);
  useEffect(() => {
    const id = setInterval(() => {
      if (Math.random() > 0.85) setCount(c => c + 1);
    }, 8000);
    return () => clearInterval(id);
  }, []);
  return count;
}

// Hook: Live blockchain log entries
export function useLiveBlockchain(initial) {
  const [logs, setLogs] = useState(initial);
  const actions = ['SENSOR_SYNC', 'CHECKPOINT_SAVED', 'AI_INFERENCE_LOG', 'HASH_VERIFIED', 'NODE_PING'];
  useEffect(() => {
    const id = setInterval(() => {
      const now = new Date();
      const h = String(now.getHours()).padStart(2, '0');
      const m = String(now.getMinutes()).padStart(2, '0');
      const s = String(now.getSeconds()).padStart(2, '0');
      const newLog = {
        block: `0x${Math.floor(Math.random() * 0xFFFF).toString(16).padStart(4, '0')}...${Math.floor(Math.random() * 0xFFFF).toString(16).padStart(4, '0')}`,
        hash: `0x${Math.floor(Math.random() * 0xFFFFFFFFFFFF).toString(16).padStart(12, '0')}`,
        timestamp: `${h}:${m}:${s}`,
        action: actions[Math.floor(Math.random() * actions.length)],
        status: 'VERIFIED',
      };
      setLogs(prev => [newLog, ...prev.slice(0, 4)]);
    }, 5000);
    return () => clearInterval(id);
  }, []);
  return logs;
}
