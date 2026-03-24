interface SectionHeaderProps {
  icon: string;
  title: string;
  subtitle?: string;
}

export default function SectionHeader({ icon, title, subtitle }: SectionHeaderProps) {
  return (
    <div className="flex items-start gap-3 pb-3 border-b-2 border-teal-light">
      <div className="w-10 h-10 rounded-xl bg-linear-to-br from-teal-base to-teal-dark flex items-center justify-center text-xl shrink-0 shadow-sm">
        {icon}
      </div>
      <div>
        <h2 className="text-base font-bold text-gray-400 font-sans">{title}</h2>
        {subtitle && <p className="text-xs text-gray-300 font-sans mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}
