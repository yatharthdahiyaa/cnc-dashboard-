// server/src/services/GoogleSheetService.js
import { google } from 'googleapis';
import dotenv from 'dotenv';

dotenv.config();

class GoogleSheetService {
  constructor() {
    this.sheetId = process.env.GOOGLE_SHEET_ID;
    this.email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    this.key = process.env.GOOGLE_PRIVATE_KEY ? process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n') : null;

    // Track previous axis positions for feed rate calculation
    this.previousData = {};

    if (this.email && this.key && !this.key.includes('your_private_key_here')) {
      this.auth = new google.auth.JWT(
        this.email,
        null,
        this.key,
        ['https://www.googleapis.com/auth/spreadsheets.readonly']
      );
      this.sheets = google.sheets({ version: 'v4', auth: this.auth });
      console.log('✅ Google Sheets service configured with real credentials');
    } else {
      console.warn('⚠️ Google Sheets credentials not found or placeholder. Using simulated data.');
      this.sheets = null;
    }
  }

  /**
   * Compute derived metrics from raw CNC data using math/algorithms
   */
  computeDerivedMetrics(machineId, rawData) {
    const prev = this.previousData[machineId];
    const now = Date.now();

    // --- OEE (Overall Equipment Effectiveness) ---
    // OEE = Availability × Performance × Quality
    // Availability = runtimeToday / totalShiftTime (24h = 86400s)
    // Performance = (partsCompleted × cycleTime) / runtimeToday
    // Quality = assumed 100% for now (no reject data)
    const availability = rawData.runtime.today > 0 ? Math.min(rawData.runtime.today / 86400, 1) : 0;
    const performance = rawData.runtime.today > 0
      ? Math.min((rawData.production.partsCompleted * rawData.production.cycleTime) / rawData.runtime.today, 1)
      : 0;
    const quality = 1.0; // No reject data available
    const oee = Math.round(availability * performance * quality * 10000) / 100; // percentage with 2 decimals

    // --- Production Rate (parts/hour) ---
    const runtimeHours = rawData.runtime.today / 3600;
    const productionRate = runtimeHours > 0
      ? Math.round((rawData.production.partsCompleted / runtimeHours) * 100) / 100
      : 0;

    // --- Estimated Completion Time (seconds remaining) ---
    const partsRemaining = Math.max(rawData.production.partsTarget - rawData.production.partsCompleted, 0);
    const estimatedCompletion = partsRemaining * rawData.production.cycleTime;

    // --- Feed Rate (mm/min) from axis position deltas ---
    let feedRate = 0;
    if (prev && prev.timestamp) {
      const dt = (now - prev.timestamp) / 60000; // minutes
      if (dt > 0) {
        const dx = rawData.axis.x - (prev.axis?.x || 0);
        const dy = rawData.axis.y - (prev.axis?.y || 0);
        const dz = rawData.axis.z - (prev.axis?.z || 0);
        feedRate = Math.round(Math.sqrt(dx * dx + dy * dy + dz * dz) / dt * 100) / 100;
      }
    }

    // --- Spindle Power (relative, RPM × load%) ---
    const spindlePower = Math.round(rawData.spindle.speed * rawData.spindle.load / 100);

    // --- Utilization % ---
    const utilization = Math.round(availability * 10000) / 100;

    // --- Tool Wear Index (0-100 scale approximation) ---
    // Higher load over more time = more wear
    const toolWearIndex = Math.min(
      Math.round((rawData.spindle.load * rawData.runtime.today) / 360000 * 100) / 100,
      100
    );

    // --- Thermal Risk classification ---
    const temp = rawData.spindle.temperature;
    const thermalRisk = temp > 60 ? 'HIGH' : temp > 45 ? 'MEDIUM' : 'LOW';

    // --- Cycle Efficiency (actual vs optimal cycle time) ---
    const avgCycleTime = rawData.production.partsCompleted > 0
      ? rawData.runtime.today / rawData.production.partsCompleted
      : 0;
    const cycleEfficiency = rawData.production.cycleTime > 0 && avgCycleTime > 0
      ? Math.round((rawData.production.cycleTime / avgCycleTime) * 10000) / 100
      : 0;

    // Store current data as previous for next iteration
    this.previousData[machineId] = {
      ...rawData,
      timestamp: now
    };

    return {
      oee,
      productionRate,
      estimatedCompletion,
      feedRate,
      spindlePower,
      utilization,
      toolWearIndex,
      thermalRisk,
      cycleEfficiency,
      availability: Math.round(availability * 10000) / 100,
      performance: Math.round(performance * 10000) / 100,
      quality: 100
    };
  }

  /**
   * Generate realistic simulated CNC data with random walks
   */
  generateSimulatedData(machineId) {
    const prev = this.previousData[machineId];
    // Status distribution: 80% Running, 10% Idle, 4% Paused, 3% Alarm, 3% Maintenance
    const statusRoll = Math.random();
    const statusPick = statusRoll < 0.80 ? 'RUNNING' : statusRoll < 0.90 ? 'IDLE' : statusRoll < 0.94 ? 'PAUSED' : statusRoll < 0.97 ? 'ALARM' : 'MAINTENANCE';
    const isRunning = statusPick === 'RUNNING';

    // Random walk helper
    const walk = (current, min, max, step) => {
      const delta = (Math.random() - 0.5) * step;
      return Math.max(min, Math.min(max, Math.round((current + delta) * 100) / 100));
    };

    const baseSpeed = machineId === 'machine1' ? 12000 : 8500;
    const baseLoad = machineId === 'machine1' ? 68 : 55;
    const baseTemp = machineId === 'machine1' ? 42 : 38;
    const basePartsTarget = machineId === 'machine1' ? 300 : 200;

    let data;
    if (prev && prev.status) {
      // Walk from previous values
      const partsDelta = isRunning && Math.random() > 0.7 ? 1 : 0;
      data = {
        status: statusPick,
        spindle: {
          speed: isRunning ? walk(prev.spindle.speed, baseSpeed * 0.7, baseSpeed * 1.1, 200) : 0,
          load: isRunning ? walk(prev.spindle.load, 20, 95, 5) : 0,
          temperature: walk(prev.spindle.temperature, 25, 70, 1.5)
        },
        axis: {
          x: walk(prev.axis.x, -200, 400, 15),
          y: walk(prev.axis.y, -100, 300, 10),
          z: walk(prev.axis.z, -80, 0, 5)
        },
        production: {
          partsCompleted: Math.min(prev.production.partsCompleted + partsDelta, basePartsTarget),
          partsTarget: basePartsTarget,
          cycleTime: walk(prev.production.cycleTime, 80, 180, 5)
        },
        runtime: {
          total: prev.runtime.total + 2,
          today: prev.runtime.today + 2,
          lastJob: walk(prev.runtime.lastJob, 60, 300, 10)
        },
        alarms: [],
        timestamp: new Date().toISOString()
      };
    } else {
      // Initial data
      data = {
        status: statusPick,
        spindle: {
          speed: isRunning ? baseSpeed + (Math.random() - 0.5) * 2000 : 0,
          load: isRunning ? baseLoad + (Math.random() - 0.5) * 20 : 0,
          temperature: baseTemp + (Math.random() - 0.5) * 10
        },
        axis: {
          x: 150 + (Math.random() - 0.5) * 100,
          y: 75 + (Math.random() - 0.5) * 50,
          z: -25 + (Math.random() - 0.5) * 20
        },
        production: {
          partsCompleted: Math.floor(Math.random() * basePartsTarget * 0.8),
          partsTarget: basePartsTarget,
          cycleTime: 100 + Math.floor(Math.random() * 60)
        },
        runtime: {
          total: 50000 + Math.floor(Math.random() * 30000),
          today: 15000 + Math.floor(Math.random() * 15000),
          lastJob: 100 + Math.floor(Math.random() * 200)
        },
        alarms: [],
        timestamp: new Date().toISOString()
      };
    }

    // Round spindle values
    data.spindle.speed = Math.round(data.spindle.speed);
    data.spindle.load = Math.round(data.spindle.load * 10) / 10;
    data.spindle.temperature = Math.round(data.spindle.temperature * 10) / 10;
    data.axis.x = Math.round(data.axis.x * 100) / 100;
    data.axis.y = Math.round(data.axis.y * 100) / 100;
    data.axis.z = Math.round(data.axis.z * 100) / 100;

    return data;
  }

  /**
   * Parse column values from sheet into CNC data object
   */
  parseColumnData(values, colIndex) {
    const safeVal = (rowIdx) => values[rowIdx]?.[colIndex] || '0';
    const parseNum = (val) => parseFloat(val) || 0;

    return {
      status: values[0]?.[colIndex] || 'OFFLINE',
      spindle: {
        speed: parseNum(safeVal(1)),
        load: parseNum(safeVal(2)),
        temperature: parseNum(safeVal(3))
      },
      axis: {
        x: parseNum(safeVal(4)),
        y: parseNum(safeVal(5)),
        z: parseNum(safeVal(6))
      },
      production: {
        partsCompleted: parseInt(safeVal(7)) || 0,
        partsTarget: parseInt(safeVal(8)) || 0,
        cycleTime: parseInt(safeVal(9)) || 0
      },
      runtime: {
        total: parseInt(safeVal(10)) || 0,
        today: parseInt(safeVal(11)) || 0,
        lastJob: parseInt(safeVal(12)) || 0
      },
      alarms: [],
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Fetch data for both CNC machines.
   * Returns { machine1: { raw, derived }, machine2: { raw, derived } }
   */
  async fetchAllMachines() {
    const machines = {};

    if (this.sheets && this.sheetId) {
      try {
        // Fetch B1:C13 — column B = machine1, column C = machine2
        const response = await this.sheets.spreadsheets.values.get({
          spreadsheetId: this.sheetId,
          range: 'Sheet1!B1:C13',
        });

        const values = response.data.values;
        if (values && values.length > 0) {
          const raw1 = this.parseColumnData(values, 0); // Column B
          const raw2 = this.parseColumnData(values, 1); // Column C

          machines.machine1 = {
            id: 'machine1',
            name: 'CNC Machine 1',
            raw: raw1,
            derived: this.computeDerivedMetrics('machine1', raw1)
          };

          machines.machine2 = {
            id: 'machine2',
            name: 'CNC Machine 2',
            raw: raw2,
            derived: this.computeDerivedMetrics('machine2', raw2)
          };

          return machines;
        }
      } catch (error) {
        console.error('❌ Error fetching from Google Sheets:', error.message);
      }
    }

    // Fallback: simulated data
    const raw1 = this.generateSimulatedData('machine1');
    const raw2 = this.generateSimulatedData('machine2');

    machines.machine1 = {
      id: 'machine1',
      name: 'CNC Machine 1',
      raw: raw1,
      derived: this.computeDerivedMetrics('machine1', raw1)
    };

    machines.machine2 = {
      id: 'machine2',
      name: 'CNC Machine 2',
      raw: raw2,
      derived: this.computeDerivedMetrics('machine2', raw2)
    };

    return machines;
  }
}

export default new GoogleSheetService();
