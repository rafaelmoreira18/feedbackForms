import { useQuery } from "@tanstack/react-query";
import { tenantService } from "@/services/tenant.service";

export function useTenant(slug: string) {
  return useQuery({
    queryKey: ["tenant", slug],
    queryFn: () => tenantService.getBySlug(slug),
    enabled: !!slug,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}
