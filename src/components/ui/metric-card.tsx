import Card from "@/components/ui/card";
import Text from "@/components/ui/text";

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
}

export default function MetricCard({ title, value, subtitle }: MetricCardProps) {
  return (
    <Card shadow="sm" padding="md" className="flex flex-col gap-2">
      <Text variant="body-sm" className="text-gray-300">{title}</Text>
      <Text variant="heading-lg" className="text-blue-base">{value}</Text>
      {subtitle && (
        <Text variant="caption" className="text-gray-300">{subtitle}</Text>
      )}
    </Card>
  );
}
