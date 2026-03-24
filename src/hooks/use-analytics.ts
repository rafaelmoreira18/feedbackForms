import { useQuery } from "@tanstack/react-query";
import { analyticsService } from "@/services/analytics.service";
import type { Form3Filters } from "@/types";

export function useAnalyticsSummary(tenantSlug: string, filters?: Form3Filters) {
  return useQuery({
    queryKey: ["analytics", "summary", tenantSlug, filters],
    queryFn: () => analyticsService.getSummary(tenantSlug, filters),
    enabled: !!tenantSlug,
    staleTime: 5 * 60 * 1000,
  });
}

export function useAnalyticsByPeriod(tenantSlug: string, filters?: Form3Filters) {
  return useQuery({
    queryKey: ["analytics", "by-period", tenantSlug, filters],
    queryFn: () => analyticsService.getByPeriod(tenantSlug, filters),
    enabled: !!tenantSlug,
    staleTime: 5 * 60 * 1000,
  });
}

export function useAnalyticsByDepartment(tenantSlug: string, filters?: Form3Filters) {
  return useQuery({
    queryKey: ["analytics", "by-department", tenantSlug, filters],
    queryFn: () => analyticsService.getByDepartment(tenantSlug, filters),
    enabled: !!tenantSlug,
    staleTime: 5 * 60 * 1000,
  });
}
