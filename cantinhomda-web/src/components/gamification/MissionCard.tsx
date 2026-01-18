import { useState } from 'react';
import { Microscope, Hammer, Crown, Info, Sparkles, CheckCircle2 } from 'lucide-react';

interface RequirementAdaptation {
    id: string;
    condition: string;
    adaptedText: string;
    instructorTip?: string;
}

interface Requirement {
    id: string;
    code?: string;
    description: string;
    methodology?: 'DISCOVERY' | 'EXECUTION' | 'LEADERSHIP';
    ageGroup?: 'JUNIOR' | 'TEEN' | 'SENIOR';
    adaptations?: RequirementAdaptation[];
    userProgress?: any[]; // Simplified
}

interface MissionCardProps {
    requirement: Requirement;
    userDisabilities?: string[]; // List of user conditions (e.g. ['AUTISMO'])
    onToggle: (id: string) => void;
}

export function MissionCard({ requirement, userDisabilities = [], onToggle }: MissionCardProps) {
    const [showAdapted, setShowAdapted] = useState(false);

    // 1. Determine Methodology Icon & Style
    const getMethodologyConfig = (method: string | undefined) => {
        switch (method) {
            case 'EXECUTION':
                return {
                    icon: <Hammer className="w-5 h-5 text-orange-600" />,
                    bg: 'bg-orange-50',
                    border: 'border-orange-200',
                    label: 'Execução',
                    color: 'text-orange-700'
                };
            case 'LEADERSHIP':
                return {
                    icon: <Crown className="w-5 h-5 text-purple-600" />,
                    bg: 'bg-purple-50',
                    border: 'border-purple-200',
                    label: 'Liderança',
                    color: 'text-purple-700'
                };
            case 'DISCOVERY':
            default:
                return {
                    icon: <Microscope className="w-5 h-5 text-emerald-600" />,
                    bg: 'bg-emerald-50',
                    border: 'border-emerald-200',
                    label: 'Descoberta',
                    color: 'text-emerald-700'
                };
        }
    };

    const config = getMethodologyConfig(requirement.methodology);

    // 2. Check for Adaptations
    // Clean strings for comparison (uppercase, trim)
    const normalizedDisabilities = userDisabilities.map(d => d.toUpperCase().trim());

    const activeAdaptation = requirement.adaptations?.find(a =>
        normalizedDisabilities.includes(a.condition.toUpperCase().trim())
    );

    const isAdaptedView = showAdapted && activeAdaptation;
    const userProgress = requirement.userProgress?.[0]; // Assuming single user context
    const isCompleted = userProgress?.status === 'APPROVED';
    const isPending = userProgress?.status === 'PENDING';

    return (
        <div className={`relative group transition-all duration-300 ${config.bg} border ${config.border} rounded-xl p-4 shadow-sm hover:shadow-md`}>
            {/* Header: Badge & Status */}
            <div className="flex justify-between items-start mb-3">
                <div className="flex items-center gap-2">
                    <div className={`p-2 rounded-lg bg-white shadow-sm ${config.color}`}>
                        {config.icon}
                    </div>
                    <div>
                        <span className={`text-[10px] font-bold uppercase tracking-wider ${config.color} opacity-80`}>
                            {config.label}
                        </span>
                        {requirement.code && (
                            <div className="text-xs font-bold text-slate-700">
                                {requirement.code}
                            </div>
                        )}
                    </div>
                </div>

                {/* Status Indicator */}
                <div onClick={() => onToggle(requirement.id)} className="cursor-pointer">
                    {isCompleted ? (
                        <CheckCircle2 className="w-6 h-6 text-green-500 fill-green-100" />
                    ) : isPending ? (
                        <div className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs font-bold rounded-full animate-pulse">
                            Aguardando
                        </div>
                    ) : (
                        <div className="w-6 h-6 rounded-full border-2 border-slate-300 group-hover:border-slate-400 transition-colors" />
                    )}
                </div>
            </div>

            {/* Content Body */}
            <div className="relative">
                {/* Inclusion Toggle */}
                {activeAdaptation && (
                    <button
                        onClick={() => setShowAdapted(!showAdapted)}
                        className="absolute right-0 -top-2 text-xs flex items-center gap-1 text-blue-600 hover:text-blue-700 font-medium bg-blue-50 px-2 py-1 rounded-full transition-colors"
                    >
                        <Sparkles className="w-3 h-3" />
                        {showAdapted ? 'Ver Original' : 'Ver Adaptação'}
                    </button>
                )}

                <h3 className="text-slate-800 font-medium pr-16 mt-1 leading-snug">
                    {isAdaptedView ? activeAdaptation.adaptedText : requirement.description}
                </h3>

                {/* Instructor Tip (Only visible if adapted view is active) */}
                {isAdaptedView && activeAdaptation.instructorTip && (
                    <div className="mt-3 p-3 bg-blue-100/50 rounded-lg border border-blue-100 text-sm text-blue-800 flex items-start gap-2">
                        <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span>
                            <strong>Dica do Instrutor:</strong> {activeAdaptation.instructorTip}
                        </span>
                    </div>
                )}
            </div>

            {/* Gamification footer (XP?) */}
            {/* Could add XP value here if available in model */}
        </div>
    );
}
