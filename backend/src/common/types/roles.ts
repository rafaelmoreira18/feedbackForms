/**
 * Roles used throughout feedbackforms.
 * Mapped from Autenticacao_DB roles at login:
 *   super_admin             → holding_admin
 *   tenant_admin            → hospital_admin
 *   operator_forms          → operator_forms  (submissão de pesquisas)
 *   operator                → viewer          (legado — tratado como operator_forms)
 *   rh                      → rh_admin
 *   protocolo_admin_global  → protocolo_admin_global  (Protocolos — admin global)
 *   protocolo_admin         → protocolo_admin         (Protocolos — admin da unidade)
 *   protocolo_operador      → protocolo_operador      (Protocolos — preenche etapas; enfermagem)
 *   protocolo_medico        → protocolo_medico        (Protocolos — médico; pode encerrar protocolo)
 */
export type UserRole =
  | 'holding_admin'
  | 'hospital_admin'
  | 'operator_forms'
  | 'viewer'
  | 'rh_admin'
  | 'protocolo_admin_global'
  | 'protocolo_admin'
  | 'protocolo_operador'
  | 'protocolo_medico';
