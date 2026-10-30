'use client';

import { useState } from 'react';
import {
  MessageCircle,
  Smartphone,
  PhoneCall,
  Clock,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Play,
  Check,
  ChevronDown
} from 'lucide-react';

export default function RecoveryWorkflowBuilder() {
  const [activeStep, setActiveStep] = useState<number>(1);
  const [runningSimulation, setRunningSimulation] = useState(false);
  const [simulationLog, setSimulationLog] = useState<string[]>([]);

  const workflowSteps = [
    {
      step: 1,
      title: 'Shopper Drop-Off Detected',
      channel: 'PilotTag Behavioral Tracker',
      timing: 'Real-time (0 mins)',
      description: 'Customer enters checkout, hesitates on payment or backs out. MarkTag captures cart value & customer phone.',
      icon: Clock,
      color: '#3EE0D2',
    },
    {
      step: 2,
      title: 'Intent & Margin Guardrail Evaluation',
      channel: 'Athena 2.0 LEM Vector Engine',
      timing: '+2 mins delay',
      description: 'Evaluates shopper intent (384-D vector). Verifies gross profit margin (>20%) before unlocking discounts.',
      icon: Sparkles,
      color: '#BF7AF0',
    },
    {
      step: 3,
      title: 'Primary Touchpoint: WhatsApp Cloud',
      channel: 'WhatsApp Business API',
      timing: '+15 mins after drop-off',
      description: 'Dispatches conversational 1-tap confirmation with product photo, order summary, and "Confirm Order" button.',
      icon: MessageCircle,
      color: '#4CD964',
    },
    {
      step: 4,
      title: 'Fallback 1: Urgent SMS Gateway',
      channel: 'Telco SMS Direct Route',
      timing: '+45 mins (If WhatsApp unopened)',
      description: 'Sends concise 140-char SMS with limited-time COD booking link and guarantee assurance.',
      icon: Smartphone,
      color: '#FF7A50',
    },
    {
      step: 5,
      title: 'Fallback 2: AI Voice Phone Call Agent',
      channel: 'Telephony Voice AI (Bengali/English)',
      timing: '+3 hours (High-value carts > ৳2,000)',
      description: 'AI customer service voice agent calls to politely address delivery concerns and secure COD confirmation.',
      icon: PhoneCall,
      color: '#D4F54C',
    },
  ];

  const handleRunSimulation = async () => {
    setRunningSimulation(true);
    setSimulationLog([]);

    const logMessages = [
      '⚡ [T+0s] PilotTag fired: Cart dropped for ৳2,450 (Phone: 01711223344)...',
      '🧠 [T+1s] Athena 2.0 Vector intent scored: 92/100 (High-Intent Evaluator).',
      '🛡️ [T+2s] Margin Guardrail passed: 42% gross margin permits max ৳250 discount.',
      '💬 [T+3s] WhatsApp Cloud payload prepared: "আসসালামু আলাইকুম তানভীর..."',
      '📱 [T+4s] Fallback rules armed: SMS in 45m | Voice Call scheduled in 3h.',
      '✅ [T+5s] Autonomous Sequence active. 0 human intervention required.',
    ];

    for (let i = 0; i < logMessages.length; i++) {
      await new Promise(r => setTimeout(r, 650));
      setSimulationLog(prev => [...prev, logMessages[i]]);
    }
    setRunningSimulation(false);
  };

  return (
    <div className="rounded-3xl border border-[#1E2026] bg-[#111215] p-6 sm:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-[#1E2026]">
        <div>
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Sparkles size={18} className="text-[#D4F54C]" />
            <span>Autonomous Recovery Sequence Pipeline (Markopolo 2.0 Architecture)</span>
          </h3>
          <p className="text-xs text-white/50 mt-0.5">
            Real-time intent-driven multi-channel recovery matrix with automated fallbacks.
          </p>
        </div>

        <button
          type="button"
          onClick={handleRunSimulation}
          disabled={runningSimulation}
          className="px-4 py-2 rounded-xl bg-[#D4F54C] hover:bg-[#C2E338] text-black text-xs font-black transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50 shadow-md shadow-[#D4F54C]/10"
        >
          <Play size={13} className="fill-black" />
          <span>{runningSimulation ? 'Executing Sequence...' : 'Test Fire Sequence'}</span>
        </button>
      </div>

      {/* Visual Pipeline Stepper */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-3 relative">
        {workflowSteps.map(step => {
          const Icon = step.icon;
          const isActive = activeStep === step.step;
          return (
            <button
              key={step.step}
              type="button"
              onClick={() => setActiveStep(step.step)}
              className={`p-4 rounded-2xl border text-left transition cursor-pointer space-y-3 flex flex-col justify-between ${
                isActive
                  ? 'border-[#D4F54C] bg-[#161A12] shadow-lg shadow-[#D4F54C]/5'
                  : 'border-[#1E2026] bg-black/40 hover:bg-white/[0.02]'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase text-white/40">Step 0{step.step}</span>
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: step.color }} />
              </div>

              <div className="w-8 h-8 rounded-xl bg-white/5 flex items-center justify-center" style={{ color: step.color }}>
                <Icon size={16} />
              </div>

              <div className="space-y-1">
                <div className="text-xs font-bold text-white leading-tight">{step.title}</div>
                <div className="text-[10px] font-mono text-[#D4F54C]">{step.timing}</div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Step Deep Dive */}
      <div className="p-5 rounded-2xl bg-[#0E0F12] border border-[#1E2026] space-y-2">
        <div className="text-xs font-black uppercase tracking-wider text-white/40">
          Selected Phase Detail: Step 0{activeStep}
        </div>
        <div className="text-sm font-bold text-white">
          {workflowSteps[activeStep - 1].title} — <span className="text-[#D4F54C]">{workflowSteps[activeStep - 1].channel}</span>
        </div>
        <p className="text-xs text-white/70 leading-relaxed">
          {workflowSteps[activeStep - 1].description}
        </p>
      </div>

      {/* Live Simulation Terminal */}
      {simulationLog.length > 0 && (
        <div className="p-4 rounded-2xl bg-black border border-[#1E2026] font-mono text-xs text-emerald-400 space-y-1.5 max-h-48 overflow-y-auto">
          <div className="text-[10px] text-white/40 uppercase mb-2">Live Sequence Execution Feed:</div>
          {simulationLog.map((log, idx) => (
            <div key={idx} className="flex items-center gap-2">
              <span className="text-white/30">›</span>
              <span>{log}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
