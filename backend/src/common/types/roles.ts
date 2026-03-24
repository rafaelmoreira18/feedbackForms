/**
 * Roles used throughout feedbackforms.
 * Mapped from Multi_UnidadesDB roles at login:
 *   super_admin  → holding_admin
 *   tenant_admin → hospital_admin
 *   operator     → viewer
 *   rh           → rh_admin
 */
export type UserRole = 'holding_admin' | 'hospital_admin' | 'viewer' | 'rh_admin';
