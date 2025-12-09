import React from 'react';
import { Check, Clock, Brain, Layers, ArrowRight, X } from 'lucide-react';
import { GeneratedPlan, CalendarEvent } from '../types';

interface StrategySelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  plans: GeneratedPlan[];
  onSelectPlan: (plan: GeneratedPlan) => void;
}

const StrategySelectionModal: React.FC<StrategySelectionModalProps> = ({ 
  isOpen, 
  onClose, 
  plans, 
  onSelectPlan 
}) => {
  if (!isOpen) return null;

  const getIcon = (name: string) => {
    if (name.includes('交錯')) return <Layers className="w-6 h-6 text-blue-500" />;
    if (name.includes('連續') || name.includes('專注')) return <ArrowRight className="w-6 h-6 text-green-500" />;
    if (name.includes('負載') || name.includes('智能')) return <Brain className="w-6 h-6 text-purple-500" />;
    return <Clock className="w-6 h-6 text-slate-500" />;
  };

  const getColor = (name: string) => {
    if (name.includes('交錯')) return 'border-blue-200 bg-blue-50 hover:border-blue-400';
    if (name.includes('連續') || name.includes('專注')) return 'border-green-200 bg-green-50 hover:border-green-400';
    if (name.includes('負載') || name.includes('智能')) return 'border-purple-200 bg-purple-50 hover:border-purple-400';
    return 'border-slate-200 bg-slate-50 hover:border-slate-400';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="px-8 py-6 border-b border-slate-100 flex justify-between items-center bg-gradient-to-r from-slate-50 to-white">
          <div>
            <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
              <Brain className="text-sprite-600" />
              選擇排程策略
            </h2>
            <p className="text-slate-500 mt-1">AI 已為您分析任務語義，並生成了三種不同的執行方案。</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400 hover:text-slate-600 transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="p-8 overflow-y-auto custom-scrollbar bg-slate-50/50">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {plans.map((plan) => (
              <div 
                key={plan.id}
                onClick={() => onSelectPlan(plan)}
                className={`
                  relative p-6 rounded-xl border-2 cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 group
                  ${getColor(plan.strategyName)}
                `}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 bg-white rounded-xl shadow-sm group-hover:scale-110 transition-transform duration-300">
                    {getIcon(plan.strategyName)}
                  </div>
                  <div className="flex gap-2">
                    {plan.tags.map((tag, i) => (
                      <span key={i} className="text-[10px] font-bold px-2 py-1 bg-white/60 rounded-full text-slate-600 uppercase tracking-wider">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <h3 className="text-xl font-bold text-slate-800 mb-2 group-hover:text-sprite-700 transition-colors">
                  {plan.strategyName}
                </h3>
                
                <p className="text-sm text-slate-600 leading-relaxed mb-6 min-h-[60px]">
                  {plan.description}
                </p>

                <div className="space-y-3">
                  <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">排程預覽</div>
                  {plan.events.slice(0, 3).map((evt, idx) => (
                    <div key={idx} className="flex items-center gap-3 text-sm bg-white/60 p-2 rounded-lg">
                      <div className="w-1.5 h-1.5 rounded-full bg-slate-400"></div>
                      <div className="truncate flex-1 font-medium text-slate-700">{evt.title.replace(/^\[.*?\]\s*/, '')}</div>
                      <div className="text-xs text-slate-500 tabular-nums">
                        {new Date(evt.start).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit', hour12: false})}
                      </div>
                    </div>
                  ))}
                  {plan.events.length > 3 && (
                    <div className="text-center text-xs text-slate-400 mt-2">
                      + 還有 {plan.events.length - 3} 個任務
                    </div>
                  )}
                </div>

                <div className="mt-6 pt-4 border-t border-slate-200/50 flex items-center justify-between text-sprite-600 font-semibold text-sm opacity-0 group-hover:opacity-100 transform translate-y-2 group-hover:translate-y-0 transition-all">
                  <span>採用此方案</span>
                  <ArrowRight size={16} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StrategySelectionModal;