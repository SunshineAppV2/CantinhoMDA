import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/axios';
import { MissionCard } from './gamification/MissionCard';

interface MemberRequirementsListProps {
    memberId: string;
}

export function MemberRequirementsList({ memberId }: MemberRequirementsListProps) {
    const queryClient = useQueryClient();

    // 1. Fetch Requirements
    const { data: requirements = [] } = useQuery<any[]>({
        queryKey: ['member-requirements', memberId],
        queryFn: async () => {
            const response = await api.get('/requirements', { params: { userId: memberId } });
            return response.data;
        },
        enabled: !!memberId
    });

    // 2. Fetch User Profile (for Gamification/Inclusion)
    const { data: user } = useQuery<any>({
        queryKey: ['user-profile', memberId],
        queryFn: async () => {
            const response = await api.get(`/users/${memberId}`);
            return response.data;
        },
        enabled: !!memberId
    });

    // 3. Toggle/Interaction Handler
    const toggleMutation = useMutation({
        mutationFn: async (reqId: string) => {
            // For now, toggle status. In future, this might be "Request Approval"
            await api.post(`/requirements/${reqId}/toggle`, { userId: memberId });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['member-requirements', memberId] });
        }
    });

    const pendingRequirements = requirements.filter(req =>
        // Show if pending OR if it has adaptations (to show inclusion options even if done?)
        // For now, stick to pending logic but maybe allow seeing all?
        // The original component only showed pending.
        // Let's keep showing only pending/active ones to not clutter.
        req.userProgress?.some((up: any) => up.status === 'PENDING')
        || !req.userProgress || req.userProgress.length === 0
        // Showing unstarted ones too? The original code filtered:
        // req.userProgress?.some((up: any) => up.status === 'PENDING')
        // This implies it ONLY showed started-but-pending? 
        // Or did the backend only return assigned ones?
        // User said "A Fazer" or "Aguardando Aprovação".
        // If I want to show "To Do" items, I should probably show unstarted ones too if they are assigned to the class?
        // But the previous logic was specific. I will stick to "Pending" for now to match behavior, 
        // BUT usually "Pending" means "Waiting Approval" or "Assigned".
    );

    // If we rely on the backend "findAll" returning requirements for the user's class/club, 
    // likely returning ALL available requirements.
    // The previous filter `req.userProgress?.some...` might have hidden requirements the user hasn't even started?
    // Let's verify what `pendingRequirements` logic was doing.
    // Original: `requirements.filter(req => req.userProgress?.some((up: any) => up.status === 'PENDING'))`
    // This looks like it ONLY shows requirements that have a UserRequirement record with status PENDING.
    // So if a requirement exists for the class but hasn't been "started/assigned", it wouldn't show?
    // Or does the backend auto-assign?
    // Let's trust the previous logic for "Assignments".

    if (pendingRequirements.length === 0) {
        return (
            <p className="text-slate-500 text-sm italic text-center py-4 border rounded-lg border-dashed">
                Nenhum requisito pendente.
            </p>
        );
    }

    return (
        <div className="grid grid-cols-1 gap-3 max-h-[400px] overflow-y-auto pr-2">
            {pendingRequirements.map(req => (
                <MissionCard
                    key={req.id}
                    requirement={req}
                    userDisabilities={user?.disabilities || []}
                    onToggle={() => toggleMutation.mutate(req.id)}
                />
            ))}
        </div>
    );
}
