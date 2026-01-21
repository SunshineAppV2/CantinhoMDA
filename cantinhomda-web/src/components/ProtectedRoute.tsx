
import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function ProtectedRoute({ allowedRoles }: { allowedRoles?: string[] }) {
    const { isAuthenticated, loading, user } = useAuth();
    const location = useLocation();

    if (loading) {
        return <div className="min-h-screen flex items-center justify-center bg-slate-100">Carregando...</div>;
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // Force Password Change Check
    if (user?.mustChangePassword && location.pathname !== '/change-password') {
        return <Navigate to="/change-password" replace />;
    }

    // Force Profile Completion for Coordinators
    const isCoordinator = ['COORDINATOR_REGIONAL', 'COORDINATOR_DISTRICT', 'COORDINATOR_AREA'].includes(user?.role || '');
    if (isCoordinator && location.pathname !== '/complete-profile') {
        // Check strict compliance
        const hasUnion = !!user?.union;
        const hasAssociation = !!(user?.association || user?.mission);
        const hasRegion = (user?.role === 'COORDINATOR_REGIONAL' || user?.role === 'COORDINATOR_DISTRICT') ? !!user?.region : true;
        const hasDistrict = user?.role === 'COORDINATOR_DISTRICT' ? !!user?.district : true;

        console.log('[ProtectedRoute] Coordinator Profile Check:', {
            role: user?.role,
            hasUnion,
            hasAssociation,
            hasRegion,
            hasDistrict,
            union: user?.union,
            association: user?.association,
            mission: user?.mission,
            region: user?.region,
            district: user?.district
        });

        if (!hasUnion || !hasAssociation || !hasRegion || !hasDistrict) {
            console.warn('[ProtectedRoute] ⚠️ Redirecting to /complete-profile - Missing data');
            return <Navigate to="/complete-profile" replace />;
        }
    }

    if (allowedRoles && user && !allowedRoles.includes(user.role)) {
        return <Navigate to="/dashboard" replace />;
    }

    return <Outlet />;
}
