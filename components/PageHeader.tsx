import Link from "next/link";

interface PageHeaderProps {
  icon?: string;
  title: string;
  actions?: React.ReactNode;
  breadcrumb?: { label: string; href?: string }[];
}

export default function PageHeader({ icon, title, actions, breadcrumb }: PageHeaderProps) {
  return (
    <div className="flex items-start justify-between px-3 pt-3 pb-1 bg-white">
      <div className="flex items-center gap-2">
        {icon && <span className="text-xl">{icon}</span>}
        <h1 className="text-2xl font-normal text-gray-800">{title}</h1>
      </div>
      {breadcrumb && (
        <div className="flex items-center gap-2 text-xs text-blue-600">
          {breadcrumb.map((b, i) => (
            <span key={i} className="flex items-center gap-2">
              {i > 0 && <span className="text-gray-400">|</span>}
              {b.href ? (
                <Link href={b.href} className="hover:underline">{b.label}</Link>
              ) : (
                <span className="text-gray-500 cursor-pointer hover:underline">{b.label}</span>
              )}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
