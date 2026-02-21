// client/src/pages/CNNModelPage.jsx
import { useDashboardStore } from '../store/useDashboardStore';
import GaugeChart from '../components/charts/GaugeChart';
import { FaBrain, FaExclamationTriangle, FaCheckCircle, FaClock, FaWrench } from 'react-icons/fa';

const ConfidenceBadge = ({ score }) => {
    const color = score >= 0.9 ? 'text-green-400 bg-green-500/10' : score >= 0.7 ? 'text-amber-400 bg-amber-500/10' : 'text-red-400 bg-red-500/10';
    return (
        <span className={`px-2 py-1 rounded-lg text-xs font-mono font-bold ${color}`}>
            {(score * 100).toFixed(1)}%
        </span>
    );
};

const CNNModelPage = () => {
    const { cnnPredictions } = useDashboardStore();

    const predictions = cnnPredictions || {
        anomalyScore: 0,
        toolLifeRemaining: 0,
        qualityClass: 'Unknown',
        confidence: 0,
        lastUpdate: null,
        modelAvailable: false,
        predictedDefectType: null,
        uncertainty: 0,
    };

    const isAvailable = predictions.modelAvailable;
    const timeSinceUpdate = predictions.lastUpdate
        ? Math.round((Date.now() - predictions.lastUpdate) / 1000)
        : null;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                        <FaBrain className="text-accent-purple" /> CNN Model Interface
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">Predictive analytics and anomaly detection</p>
                </div>

                {/* Status indicator */}
                <div className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium
          ${isAvailable
                        ? 'bg-green-500/10 text-green-400 border-green-500/20'
                        : 'bg-red-500/10 text-red-400 border-red-500/20'
                    }`}>
                    <span className={`w-2 h-2 rounded-full ${isAvailable ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
                    {isAvailable ? 'Model Active' : 'Model Unavailable'}
                </div>
            </div>

            {/* Unavailable banner */}
            {!isAvailable && (
                <div className="glass-card-static p-6 border-l-4 border-amber-500/50">
                    <div className="flex items-start gap-3">
                        <FaExclamationTriangle className="text-amber-400 mt-0.5 flex-shrink-0" />
                        <div>
                            <h3 className="text-white font-semibold">CNN Model Fallback Mode</h3>
                            <p className="text-gray-400 text-sm mt-1">
                                No predictions received from the external Python script. Displaying simulated values.
                                Configure your Python script to POST to <code className="text-accent-cyan text-xs bg-dark-700 px-1.5 py-0.5 rounded">/api/cnn/predict</code>
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Main Gauges */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Anomaly Score */}
                <div className="glass-card p-6">
                    <h3 className="text-sm font-semibold text-gray-400 mb-4 flex items-center gap-2">
                        <FaExclamationTriangle size={12} className="text-red-400" />
                        Anomaly Detection Score
                    </h3>
                    <div className="flex justify-center">
                        <GaugeChart
                            value={predictions.anomalyScore}
                            max={100}
                            label="Anomaly Risk"
                            unit="%"
                            size={160}
                            zones={[
                                { end: 0.3, color: '#10b981' },
                                { end: 0.7, color: '#f59e0b' },
                                { end: 1.0, color: '#ef4444' },
                            ]}
                        />
                    </div>
                    <div className="text-center mt-2">
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${predictions.anomalyScore < 30 ? 'bg-green-500/10 text-green-400' :
                                predictions.anomalyScore < 70 ? 'bg-amber-500/10 text-amber-400' :
                                    'bg-red-500/10 text-red-400'
                            }`}>
                            {predictions.anomalyScore < 30 ? 'Normal' : predictions.anomalyScore < 70 ? 'Warning' : 'Critical'}
                        </span>
                    </div>
                </div>

                {/* Tool Life Remaining */}
                <div className="glass-card p-6">
                    <h3 className="text-sm font-semibold text-gray-400 mb-4 flex items-center gap-2">
                        <FaWrench size={12} className="text-accent-blue" />
                        Predicted Tool Life
                    </h3>
                    <div className="flex justify-center">
                        <GaugeChart
                            value={predictions.toolLifeRemaining}
                            max={100}
                            label="Remaining Life"
                            unit="%"
                            size={160}
                            zones={[
                                { end: 0.25, color: '#ef4444' },
                                { end: 0.5, color: '#f59e0b' },
                                { end: 1.0, color: '#10b981' },
                            ]}
                        />
                    </div>
                    <div className="text-center mt-2">
                        <span className="text-xs text-gray-500">
                            Est. {Math.round(predictions.toolLifeRemaining * 0.5)} hours remaining
                        </span>
                    </div>
                </div>

                {/* Quality Classification */}
                <div className="glass-card p-6">
                    <h3 className="text-sm font-semibold text-gray-400 mb-4 flex items-center gap-2">
                        <FaCheckCircle size={12} className="text-accent-green" />
                        Quality Classification
                    </h3>
                    <div className="flex flex-col items-center justify-center py-4">
                        <div className={`w-24 h-24 rounded-full flex items-center justify-center border-4 mb-4
              ${predictions.qualityClass === 'Good' ? 'border-green-500/30 bg-green-500/10' :
                                predictions.qualityClass === 'Marginal' ? 'border-amber-500/30 bg-amber-500/10' :
                                    'border-red-500/30 bg-red-500/10'}`}>
                            <span className={`text-2xl font-bold
                ${predictions.qualityClass === 'Good' ? 'text-green-400' :
                                    predictions.qualityClass === 'Marginal' ? 'text-amber-400' :
                                        'text-red-400'}`}>
                                {predictions.qualityClass === 'Good' ? '✓' : predictions.qualityClass === 'Marginal' ? '~' : '✕'}
                            </span>
                        </div>
                        <span className="text-white font-semibold text-lg">{predictions.qualityClass}</span>
                        <div className="flex items-center gap-2 mt-2">
                            <span className="text-xs text-gray-500">Confidence:</span>
                            <ConfidenceBadge score={predictions.confidence} />
                        </div>
                    </div>
                </div>
            </div>

            {/* Detailed Predictions Table */}
            <div className="glass-card p-6">
                <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                    <span>📋</span> Prediction Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-dark-700/50 rounded-xl p-4 space-y-3">
                        <h4 className="text-xs text-gray-500 uppercase tracking-wider font-bold">Model Metrics</h4>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-400">Confidence Score</span>
                            <ConfidenceBadge score={predictions.confidence} />
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-400">Uncertainty</span>
                            <span className="text-sm font-mono text-gray-300">±{(predictions.uncertainty * 100).toFixed(2)}%</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-400">Predicted Defect</span>
                            <span className="text-sm font-mono text-gray-300">{predictions.predictedDefectType || 'None'}</span>
                        </div>
                    </div>

                    <div className="bg-dark-700/50 rounded-xl p-4 space-y-3">
                        <h4 className="text-xs text-gray-500 uppercase tracking-wider font-bold">System Status</h4>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-400">Last Updated</span>
                            <span className="text-sm font-mono text-gray-300">
                                {timeSinceUpdate !== null ? `${timeSinceUpdate}s ago` : 'Never'}
                            </span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-400">Data Source</span>
                            <span className="text-sm text-gray-300">{isAvailable ? 'Python Script' : 'Simulated'}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-400">Protocol</span>
                            <span className="text-sm font-mono text-accent-cyan">REST + WebSocket</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* API Documentation */}
            <div className="glass-card-static p-6">
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                    <span>🔌</span> Integration API
                </h3>
                <p className="text-sm text-gray-400 mb-3">Send predictions from your Python script:</p>
                <div className="bg-dark-700 rounded-xl p-4 font-mono text-xs text-gray-300 overflow-x-auto">
                    <pre>{`POST http://localhost:3002/api/cnn/predict
Content-Type: application/json

{
  "anomalyScore": 15.2,
  "toolLifeRemaining": 78.5,
  "qualityClass": "Good",
  "confidence": 0.94,
  "predictedDefectType": null,
  "uncertainty": 0.03
}`}</pre>
                </div>
            </div>
        </div>
    );
};

export default CNNModelPage;
