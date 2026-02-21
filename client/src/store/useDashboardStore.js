// client/src/store/useDashboardStore.js
import { create } from 'zustand';
import { websocketService } from '../services/websocketService';

// Operator names for logbook
const operators = ['Rajesh K.', 'Sunil M.', 'Priya S.', 'Arun D.'];
const materials = ['Aluminium 6061', 'Steel SS304', 'Brass C360', 'Titanium Ti-6Al-4V'];
const batchPrefix = 'BATCH';

let workpieceCounter = 0;
let logbookCounter = 0;

export const useDashboardStore = create((set, get) => ({
  // Multi-machine state
  machines: {},
  isConnected: false,
  isConnecting: false,
  error: null,
  lastUpdate: null,
  updateCount: 0,

  // Per-machine history for charts
  machineHistory: {},

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
      // ── Deduplication: skip if data hasn't changed ──────────────────────
      const incomingTs = Object.values(machinesData)
        .filter(Boolean)
        .map(m => m.raw?.timestamp)
        .join('|');
      const currentTs = Object.values(useDashboardStore.getState().machines)
        .filter(Boolean)
        .map(m => m.raw?.timestamp)
        .join('|');
      if (incomingTs && incomingTs === currentTs) return; // identical — skip re-render

      set((state) => {
        const newHistory = { ...state.machineHistory };
        const currentAlerts = [...state.activeAlerts];
        const alertHist = [...state.alertHistory];
        const suppressed = new Set(state.suppressedAlerts);
        const thresholds = state.alertThresholds;
        const newLogbook = [...state.logbookEvents];
        const newWorkpieces = [...state.workpieces];
        const prevMachines = state.machines;
        let cnnPredictions = { ...state.cnnPredictions };

        // Update history for each machine and check for alerts
        Object.keys(machinesData).forEach((machineId) => {
          const machineInfo = machinesData[machineId];
          if (!machineInfo || !machineInfo.raw) return;

          const point = {
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            spindleSpeed: machineInfo.raw.spindle?.speed || 0,
            spindleLoad: machineInfo.raw.spindle?.load || 0,
            temperature: machineInfo.raw.spindle?.temperature || 0,
            partsCompleted: machineInfo.raw.production?.partsCompleted || 0,
            oee: machineInfo.derived?.oee || 0,
            timestamp: Date.now()
          };

          const existing = newHistory[machineId] || [];
          newHistory[machineId] = [...existing, point].slice(-30);

          // --- ALERT LOGIC ---
          const checkAlert = (type, condition, message, severity = 'warning') => {
            const alertId = `${machineId}-${type}`;
            const existingAlertIndex = currentAlerts.findIndex(a => a.id === alertId);
            const isSuppressed = suppressed.has(alertId);

            if (condition) {
              if (existingAlertIndex === -1 && !isSuppressed) {
                const newAlert = {
                  id: alertId, machineId,
                  machineName: machineInfo.name, type, message,
                  timestamp: Date.now(), severity,
                  acknowledged: false, resolved: false,
                };
                currentAlerts.push(newAlert);
                alertHist.unshift(newAlert);
                if (alertHist.length > 200) alertHist.pop();
              }
            } else {
              if (existingAlertIndex !== -1) {
                currentAlerts.splice(existingAlertIndex, 1);
              }
              if (isSuppressed) suppressed.delete(alertId);
            }
          };

          checkAlert('speed', point.spindleSpeed > thresholds.spindleSpeed, `High Spindle Speed: ${point.spindleSpeed} RPM`, 'warning');
          checkAlert('load', point.spindleLoad > thresholds.spindleLoad, `High Spindle Load: ${point.spindleLoad}%`, 'critical');
          checkAlert('temp', point.temperature > thresholds.temperature, `High Temperature: ${point.temperature}°C`, 'critical');
          checkAlert('oee', machineInfo.raw.status === 'RUNNING' && point.oee < thresholds.oee, `Low OEE: ${point.oee}%`, 'info');

          const now = new Date();
          const day = now.getDay();
          const hour = now.getHours();
          const isWorkingHours = day !== 0 && hour >= 9 && hour < 17;
          checkAlert('idle_shift', isWorkingHours && machineInfo.raw.status === 'IDLE', `Machine IDLE during active shift (9AM-5PM)`, 'warning');

          // --- LOGBOOK EVENTS (detect state changes) ---
          const prevMachine = prevMachines[machineId];
          if (prevMachine && prevMachine.raw) {
            const prevStatus = prevMachine.raw.status;
            const newStatus = machineInfo.raw.status;
            if (prevStatus !== newStatus) {
              logbookCounter++;
              const operator = operators[Math.floor(Math.random() * operators.length)];
              if (newStatus === 'RUNNING' && prevStatus !== 'RUNNING') {
                newLogbook.unshift({
                  id: `log-${logbookCounter}`, machineId, machineName: machineInfo.name,
                  type: 'start', message: `Machine started (was ${prevStatus})`,
                  operator, timestamp: Date.now(), details: `Status: ${prevStatus} → ${newStatus}`
                });
              } else if (newStatus === 'IDLE') {
                newLogbook.unshift({
                  id: `log-${logbookCounter}`, machineId, machineName: machineInfo.name,
                  type: 'stop', message: `Machine stopped`,
                  operator, timestamp: Date.now(), details: `Status: ${prevStatus} → IDLE`
                });
              } else if (newStatus === 'ALARM') {
                newLogbook.unshift({
                  id: `log-${logbookCounter}`, machineId, machineName: machineInfo.name,
                  type: 'alarm', message: `Alarm triggered`,
                  operator, timestamp: Date.now(), details: 'Automatic alarm detection'
                });
              } else if (newStatus === 'MAINTENANCE') {
                newLogbook.unshift({
                  id: `log-${logbookCounter}`, machineId, machineName: machineInfo.name,
                  type: 'maintenance', message: `Entered maintenance mode`,
                  operator, timestamp: Date.now(), details: 'Scheduled maintenance'
                });
              }
            }

            // Detect parameter changes (spindle speed delta > 500)
            const prevSpeed = prevMachine.raw.spindle?.speed || 0;
            const newSpeed = machineInfo.raw.spindle?.speed || 0;
            if (Math.abs(newSpeed - prevSpeed) > 500) {
              logbookCounter++;
              newLogbook.unshift({
                id: `log-${logbookCounter}`, machineId, machineName: machineInfo.name,
                type: 'parameter_change', message: `Spindle speed: ${prevSpeed} → ${newSpeed} RPM`,
                operator: operators[Math.floor(Math.random() * operators.length)],
                timestamp: Date.now(), details: `Delta: ${newSpeed - prevSpeed} RPM`
              });
            }
          }
          // Keep logbook bounded
          while (newLogbook.length > 500) newLogbook.pop();

          // --- WORKPIECE GENERATION (on parts count increase) ---
          if (prevMachine && prevMachine.raw) {
            const prevParts = prevMachine.raw.production?.partsCompleted || 0;
            const newParts = machineInfo.raw.production?.partsCompleted || 0;
            if (newParts > prevParts) {
              for (let p = 0; p < (newParts - prevParts); p++) {
                workpieceCounter++;
                const quality = Math.random() > 0.95 ? 'Fail' : Math.random() > 0.90 ? 'Rework' : 'Pass';
                const diameter = 25.0 + (Math.random() - 0.5) * 0.12; // nominal 25mm ± 0.06
                newWorkpieces.unshift({
                  partId: `WP-${String(workpieceCounter).padStart(4, '0')}`,
                  machineId, machineName: machineInfo.name,
                  cycleTime: machineInfo.raw.production?.cycleTime || 120,
                  quality,
                  dimensions: { diameter: Math.round(diameter * 1000) / 1000 },
                  material: materials[Math.floor(Math.random() * materials.length)],
                  waste: Math.round((Math.random() * 5 + 1) * 10) / 10,
                  batchId: `${batchPrefix}-${new Date().toISOString().slice(0, 10)}-${machineId.replace('machine', '')}`,
                  timestamp: Date.now(),
                });
              }
              while (newWorkpieces.length > 200) newWorkpieces.pop();
            }
          }
        });

        // --- CNN SIMULATED PREDICTIONS (update every ~10 cycles) ---
        if (state.updateCount % 5 === 0) {
          const anomalyBase = cnnPredictions.anomalyScore;
          cnnPredictions = {
            ...cnnPredictions,
            anomalyScore: Math.max(0, Math.min(100, anomalyBase + (Math.random() - 0.5) * 8)),
            toolLifeRemaining: Math.max(10, Math.min(100, cnnPredictions.toolLifeRemaining - Math.random() * 0.5)),
            qualityClass: Math.random() > 0.9 ? 'Marginal' : 'Good',
            confidence: 0.85 + Math.random() * 0.14,
            uncertainty: 0.01 + Math.random() * 0.06,
            lastUpdate: Date.now(),
            modelAvailable: false,
            predictedDefectType: Math.random() > 0.85 ? 'Surface Roughness' : null,
          };
        }

        return {
          machines: machinesData,
          machineHistory: newHistory,
          activeAlerts: currentAlerts,
          alertHistory: alertHist.slice(0, 200),
          suppressedAlerts: suppressed,
          logbookEvents: newLogbook,
          workpieces: newWorkpieces,
          cnnPredictions,
          lastUpdate: new Date().toISOString(),
          updateCount: state.updateCount + 1,
          error: null
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
    if (!machine) return null;
    return machine;
  },

  getMachineHistory: (machineId) => {
    return get().machineHistory[machineId] || [];
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
      utilization: machine.derived?.utilization || 0,
      thermalRisk: machine.derived?.thermalRisk || 'LOW',
    }));
  },

  refreshData: () => {
    websocketService.requestData();
  },

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
        suppressedAlerts: newSuppressed
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
      return {
        activeAlerts: [],
        suppressedAlerts: newSuppressed
      };
    });
  },

  // Update CNN predictions from external source
  setCNNPredictions: (predictions) => {
    set({
      cnnPredictions: {
        ...predictions,
        lastUpdate: Date.now(),
        modelAvailable: true,
      }
    });
  },
}));