import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/axios';
import { Users, CheckCircle } from 'lucide-react';

interface RequirementStatsProps {
    requirementId: string;
}

interface Stats {
    totalAssigned: number;
    completed: number;
    pending: number;
    approved: number;
    rejected: number;
    completionRate: number;
}

export function RequirementStats({ requirementId }: RequirementStatsProps) {
    const { data: stats, isLoading } = useQuery<Stats>({
        queryKey: ['requirement-stats', requirementId],
        queryFn: async () => {
            const res = await api.get(`/requirements/${requirementId}/stats`);
            return res.data;
        }
    });

    if (isLoading || !stats || stats.totalAssigned === 0) {
        return null;
    }

    return (
        <div className="flex flex-col gap-2 min-w-[140px]">
            {/* Total Atribuído */}
            <div className="flex items-center gap-2 text-xs">
                <Users className="w-3.5 h-3.5 text-blue-600" />
                <span className="font-medium text-slate-700">{stats.totalAssigned} membros</span>
            </div>

            {/* Barra de Progresso */}
            <div className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-600">Progresso</span>
                    <span className="font-bold text-green-600">{stats.completionRate}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                    <div
                        className="bg-gradient-to-r from-green-500 to-green-600 h-full transition-all duration-300 rounded-full"
                        style={{ width: `${stats.completionRate}%` }}
                    />
                </div>
                <div className="flex items-center gap-1 text-xs text-slate-500">
                    <CheckCircle className="w-3 h-3" />
                    <span>{stats.completed} concluídos</span>
                </div>
            </div>
        </div>
    );
}
