// client/src/store/useDashboardStore.js
import { create } from 'zustand';
import { websocketService } from '../services/websocketService';

// Operator names for logbook
const operators = ['Rajesh K.', 'Sunil M.', 'Priya S.', 'Arun D.'];

let logbookCounter = 0;

export const useDashboardStore = create((set, get) => ({
  // Machine1-only state
  machines: {},
  isConnected: false,
  isConnecting: false,
  error: null,
  lastUpdate: null,
  updateCount: 0,

  // Per-machine history for charts (last 60 points)
  machineHistory: {},

  // Idle detection state
  // idleTimers: { machine1: <timestamp when S1 first went <10> | null }
  // idleStatus: { machine1: true/false }
  idleTimers: {},
  idleStatus: {},

  // Alert thresholds & state
  alertThresholds: {
    spindleSpeed: 10000,
    spindleLoad: 90,
    temperature: 80,
    oee: 50,
  },
  activeAlerts: [],
  alertHistory: [],
  suppressedAlerts: new Set(),

  // Logbook events
  logbookEvents: [],

  // Workpiece tracking
  workpieces: [],

  // CNN Model predictions
  cnnPredictions: {
    anomalyScore: 12,
    toolLifeRemaining: 82,
    qualityClass: 'Good',
    confidence: 0.94,
    lastUpdate: null,
    modelAvailable: false,
    predictedDefectType: null,
    uncertainty: 0.03,
  },

  // Production history
  productionHistory: {},

  initialize: () => {
    const handleConnect = () => {
      set({ isConnected: true, isConnecting: false, error: null });
      setTimeout(() => websocketService.requestData(), 300);
    };

    const handleDisconnect = () => {
      set({ isConnected: false, isConnecting: false });
    };

    const handleMachinesData = (machinesData) => {
      // ── Only process machine1 ──────────────────────────────────────────────
      const filtered = { machine1: machinesData.machine1 };

      // ── Deduplication: skip if data hasn't changed ─────────────────────────
      const incomingTs = filtered.machine1?.raw?.timestamp || '';
      const currentTs = useDashboardStore.getState().machines?.machine1?.raw?.timestamp || '';
      if (incomingTs && incomingTs === currentTs) return;

      set((state) => {
        const newHistory = { ...state.machineHistory };
        const currentAlerts = [...state.activeAlerts];
        const alertHist = [...state.alertHistory];
        const suppressed = new Set(state.suppressedAlerts);
        const thresholds = state.alertThresholds;
        const newLogbook = [...state.logbookEvents];
        const newWorkpieces = [...state.workpieces];
        const prevMachines = state.machines;
        const newIdleTimers = { ...state.idleTimers };
        const newIdleStatus = { ...state.idleStatus };
        let cnnPredictions = { ...state.cnnPredictions };

        Object.keys(filtered).forEach((machineId) => {
          const machineInfo = filtered[machineId];
          if (!machineInfo || !machineInfo.raw) return;

          const now = Date.now();
          const s1 = machineInfo.raw.spindle?.speed ?? 0;
          const master = machineInfo.raw.feedRate ?? 0;

          // ── Idle detection: S1 < 10 for 15+ seconds ────────────────────────
          if (s1 < 10) {
            if (!newIdleTimers[machineId]) newIdleTimers[machineId] = now;
            newIdleStatus[machineId] = (now - newIdleTimers[machineId]) >= 15_000;
          } else {
            newIdleTimers[machineId] = null;
            newIdleStatus[machineId] = false;
          }

          const point = {
            time: new Date().toLocaleTimeString([], {
              hour: '2-digit', minute: '2-digit', second: '2-digit'
            }),
            s1,
            master,
            spindleSpeed: s1,
            spindleLoad: machineInfo.raw.spindle?.load || 0,
            temperature: machineInfo.raw.spindle?.temperature || 0,
            partsCompleted: machineInfo.raw.production?.partsCompleted || 0,
            partsTarget: machineInfo.raw.production?.partsTarget || 0,
            oee: machineInfo.derived?.oee || 0,
            timestamp: now,
          };

          const existing = newHistory[machineId] || [];
          newHistory[machineId] = [...existing, point].slice(-60);

          // ── Alert logic ─────────────────────────────────────────────────────
          const checkAlert = (type, condition, message, severity = 'warning') => {
            const alertId = `${machineId}-${type}`;
            const existingAlertIndex = currentAlerts.findIndex(a => a.id === alertId);
            const isSuppressed = suppressed.has(alertId);
            if (condition) {
              if (existingAlertIndex === -1 && !isSuppressed) {
                const newAlert = {
                  id: alertId, machineId,
                  machineName: machineInfo.name, type, message,
                  timestamp: now, severity, acknowledged: false, resolved: false,
                };
                currentAlerts.push(newAlert);
                alertHist.unshift(newAlert);
                if (alertHist.length > 200) alertHist.pop();
              }
            } else {
              if (existingAlertIndex !== -1) currentAlerts.splice(existingAlertIndex, 1);
              if (isSuppressed) suppressed.delete(alertId);
            }
          };

          checkAlert('speed', s1 > thresholds.spindleSpeed, `High Spindle Speed: ${s1} RPM`);
          checkAlert('load', point.spindleLoad > thresholds.spindleLoad, `High Spindle Load: ${point.spindleLoad}%`, 'critical');
          checkAlert('temp', point.temperature > thresholds.temperature, `High Temperature: ${point.temperature}°C`, 'critical');
          checkAlert('idle', newIdleStatus[machineId], `Machine IDLE: S1 under 10 RPM for 15+ seconds`, 'warning');

          // ── Logbook: state transitions ──────────────────────────────────────
          const prevMachine = prevMachines[machineId];
          if (prevMachine?.raw) {
            const prevStatus = prevMachine.raw.status;
            const newStatus = machineInfo.raw.status;
            if (prevStatus !== newStatus) {
              logbookCounter++;
              const operator = operators[Math.floor(Math.random() * operators.length)];
              if (newStatus === 'RUNNING') {
                newLogbook.unshift({
                  id: `log-${logbookCounter}`, machineId, machineName: machineInfo.name,
                  type: 'start', message: `Machine started (was ${prevStatus})`,
                  operator, timestamp: now, details: `Status: ${prevStatus} → ${newStatus}`
                });
              } else if (newStatus === 'IDLE') {
                newLogbook.unshift({
                  id: `log-${logbookCounter}`, machineId, machineName: machineInfo.name,
                  type: 'stop', message: `Machine went idle`,
                  operator, timestamp: now, details: `S1 < 10 RPM for 15s`
                });
              } else if (newStatus === 'ALARM') {
                newLogbook.unshift({
                  id: `log-${logbookCounter}`, machineId, machineName: machineInfo.name,
                  type: 'alarm', message: `Alarm triggered`,
                  operator, timestamp: now, details: 'Automatic alarm detection'
                });
              }
            }
            const prevSpeed = prevMachine.raw.spindle?.speed || 0;
            if (Math.abs(s1 - prevSpeed) > 500) {
              logbookCounter++;
              newLogbook.unshift({
                id: `log-${logbookCounter}`, machineId, machineName: machineInfo.name,
                type: 'parameter_change', message: `S1: ${prevSpeed} → ${s1} RPM`,
                operator: operators[Math.floor(Math.random() * operators.length)],
                timestamp: now, details: `Delta: ${s1 - prevSpeed} RPM`
              });
            }
          }
          while (newLogbook.length > 500) newLogbook.pop();

          // ── Workpiece generation (on parts count increase) ──────────────────
          if (prevMachine?.raw) {
            const prevParts = prevMachine.raw.production?.partsCompleted || 0;
            const newParts = machineInfo.raw.production?.partsCompleted || 0;
            if (newParts > prevParts) {
              for (let p = 0; p < (newParts - prevParts); p++) {
                const quality = Math.random() > 0.95 ? 'Fail' : Math.random() > 0.90 ? 'Rework' : 'Pass';
                newWorkpieces.unshift({
                  partId: `WP-${String(newWorkpieces.length + 1).padStart(4, '0')}`,
                  machineId, machineName: machineInfo.name,
                  cycleTime: machineInfo.raw.production?.cycleTime || 120,
                  quality,
                  timestamp: now,
                });
              }
              while (newWorkpieces.length > 200) newWorkpieces.pop();
            }
          }
        });

        // ── CNN simulated predictions (every 5 cycles) ─────────────────────
        if (state.updateCount % 5 === 0) {
          cnnPredictions = {
            ...cnnPredictions,
            anomalyScore: Math.max(0, Math.min(100, cnnPredictions.anomalyScore + (Math.random() - 0.5) * 8)),
            toolLifeRemaining: Math.max(10, Math.min(100, cnnPredictions.toolLifeRemaining - Math.random() * 0.5)),
            qualityClass: Math.random() > 0.9 ? 'Marginal' : 'Good',
            confidence: 0.85 + Math.random() * 0.14,
            lastUpdate: Date.now(),
            modelAvailable: false,
          };
        }

        return {
          machines: filtered,
          machineHistory: newHistory,
          activeAlerts: currentAlerts,
          alertHistory: alertHist.slice(0, 200),
          suppressedAlerts: suppressed,
          logbookEvents: newLogbook,
          workpieces: newWorkpieces,
          cnnPredictions,
          idleTimers: newIdleTimers,
          idleStatus: newIdleStatus,
          lastUpdate: new Date().toISOString(),
          updateCount: state.updateCount + 1,
          error: null,
        };
      });
    };

    websocketService.onConnect(handleConnect);
    websocketService.onDisconnect(handleDisconnect);
    websocketService.onMachinesData(handleMachinesData);

    set({ isConnecting: true });
    websocketService.connect();

    return () => {
      websocketService.removeCallback(handleConnect);
      websocketService.removeCallback(handleDisconnect);
      websocketService.removeCallback(handleMachinesData);
      websocketService.disconnect();
    };
  },

  getMachineData: (machineId) => {
    const machine = get().machines[machineId];
    return machine || null;
  },

  getMachineHistory: (machineId) => {
    return get().machineHistory[machineId] || [];
  },

  getIdleStatus: (machineId) => {
    return get().idleStatus[machineId] || false;
  },

  getAllMachinesOverview: () => {
    const machines = get().machines;
    return Object.entries(machines).map(([id, machine]) => ({
      id,
      name: machine.name,
      status: machine.raw?.status || 'OFFLINE',
      spindleSpeed: machine.raw?.spindle?.speed || 0,
      oee: machine.derived?.oee || 0,
      partsCompleted: machine.raw?.production?.partsCompleted || 0,
      partsTarget: machine.raw?.production?.partsTarget || 0,
    }));
  },

  refreshData: () => websocketService.requestData(),

  sendCommand: (machineId, type, value) => {
    websocketService.sendCommand({ machineId, type, value });
  },

  updateThresholds: (newThresholds) => {
    set((state) => ({
      alertThresholds: { ...state.alertThresholds, ...newThresholds }
    }));
  },

  dismissAlert: (alertId) => {
    set((state) => {
      const newSuppressed = new Set(state.suppressedAlerts);
      newSuppressed.add(alertId);
      return {
        activeAlerts: state.activeAlerts.filter(a => a.id !== alertId),
        suppressedAlerts: newSuppressed,
      };
    });
  },

  acknowledgeAlert: (alertId) => {
    set((state) => ({
      activeAlerts: state.activeAlerts.map(a =>
        a.id === alertId ? { ...a, acknowledged: true } : a
      ),
      alertHistory: state.alertHistory.map(a =>
        a.id === alertId ? { ...a, acknowledged: true } : a
      ),
    }));
  },

  resolveAlert: (alertId) => {
    set((state) => ({
      activeAlerts: state.activeAlerts.filter(a => a.id !== alertId),
      alertHistory: state.alertHistory.map(a =>
        a.id === alertId ? { ...a, resolved: true, resolvedAt: Date.now() } : a
      ),
    }));
  },

  clearAllAlerts: () => {
    set((state) => {
      const newSuppressed = new Set(state.suppressedAlerts);
      state.activeAlerts.forEach(a => newSuppressed.add(a.id));
      return { activeAlerts: [], suppressedAlerts: newSuppressed };
    });
  },

  setCNNPredictions: (predictions) => {
    set({
      cnnPredictions: { ...predictions, lastUpdate: Date.now(), modelAvailable: true }
    });
  },
}));