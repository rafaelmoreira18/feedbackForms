/**
 * Roles used throughout feedbackforms.
 * Mapped from Multi_UnidadesDB roles at login:
 *   super_admin        → holding_admin
 *   tenant_admin       → hospital_admin
 *   operator_forms     → operator_forms  (submissão de pesquisas)
 *   operator           → viewer          (legado — tratado como operator_forms)
 *   rh                 → rh_admin
 */
export type UserRole = 'holding_admin' | 'hospital_admin' | 'operator_forms' | 'viewer' | 'rh_admin';
