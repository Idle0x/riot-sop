import { useState } from 'react';
import { GlassCard } from '../ui/GlassCard';
import { GlassButton } from '../ui/GlassButton';
import { CheckCircle2, X, ArrowRight, ShieldAlert, Timer } from 'lucide-react';
import { type Signal } from '../../types';

interface Props {
  onClose: () => void;
  onSave: (signalData: Partial<Signal>) => void;
}

export const DrillModeModal = ({ onClose, onSave }: Props) => {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, boolean>>({});
  
  const QUESTIONS = [
    { id: 'team', text: "Is the team public & reputable?" },
    { id: 'product', text: "Is there a working product (not just a PDF)?" },
    { id: 'token', text: "Does the token have actual utility?" },
    { id: 'community', text: "Is the Discord/Community real (not bot-filled)?" },
    { id: 'narrative', text: "Does this fit a current market narrative?" }
  ];

  const handleAnswer = (yes: boolean) => {
    const currentQ = QUESTIONS[step];
    setAnswers(prev => ({ ...prev, [currentQ.id]: yes }));
    
    if (step < QUESTIONS.length - 1) {
      setStep(prev => prev + 1);
    } else {
      // Finish
      finishDrill({ ...answers, [currentQ.id]: yes });
    }
  };

  const finishDrill = (finalAnswers: Record<string, boolean>) => {
    // Calculate confidence score based on Yes answers
    const yesCount = Object.values(finalAnswers).filter(Boolean).length;
    const confidence = (yesCount / QUESTIONS.length) * 10;
    
    // Save minimal data to create a signal
    onSave({
      confidence,
      checklist: {
        hasTeam: finalAnswers['team'],
        hasProduct: finalAnswers['product'],
        hasToken: finalAnswers['token']
      },
      redFlags: !finalAnswers['team'] ? ['Anon Team'] : []
    });
  };

  const progress = ((step) / QUESTIONS.length) * 100;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/95 backdrop-blur-xl p-4">
      <GlassCard className="w-full max-w-lg p-8 relative overflow-hidden">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-500 hover:text-white"><X size={24}/></button>

        <div className="flex items-center gap-2 mb-8 text-accent-info">
          <Timer className="animate-pulse"/>
          <span className="text-xs font-bold uppercase tracking-widest">Rapid Fire Drill</span>
        </div>

        {/* Question */}
        <div className="min-h-[120px] flex flex-col justify-center mb-8">
           <h2 className="text-2xl font-bold text-white text-center">{QUESTIONS[step].text}</h2>
        </div>

        {/* Actions */}
        <div className="grid grid-cols-2 gap-4">
          <button 
            onClick={() => handleAnswer(false)}
            className="p-6 rounded-2xl border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-500 flex flex-col items-center gap-2 transition-all"
          >
            <X size={32}/>
            <span className="font-bold">NO</span>
          </button>
          
          <button 
            onClick={() => handleAnswer(true)}
            className="p-6 rounded-2xl border border-green-500/30 bg-green-500/10 hover:bg-green-500/20 text-green-500 flex flex-col items-center gap-2 transition-all"
          >
            <CheckCircle2 size={32}/>
            <span className="font-bold">YES</span>
          </button>
        </div>

        {/* Progress Bar */}
        <div className="absolute bottom-0 left-0 h-1 bg-accent-info transition-all duration-300" style={{ width: `${progress}%` }} />
      </GlassCard>
    </div>
  );
};
