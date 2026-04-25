'use client';

import { usePermissions, SystemRole } from '@/hooks/usePermissions';
import {
  IdentificationIcon,
  TagIcon,
  Square3Stack3DIcon,
  QueueListIcon,
  AdjustmentsHorizontalIcon,
  CpuChipIcon,
  TrashIcon,
  CreditCardIcon,
  MegaphoneIcon,
  CloudArrowUpIcon
} from '@heroicons/react/24/outline';
import Link from 'next/link';
import DocumentationLink from '@/components/DocumentationLink';

const BASE_SETTINGS_SECTIONS = [
  {
    id: 'metadata',
    name: 'Metadata Management',
    description: 'Configure custom fields, groups, and templates for your assets.',
    icon: IdentificationIcon,
    href: '/settings/metadata',
    color: 'bg-blue-500/10 text-blue-400',
  },
  {
    id: 'tags',
    name: 'Tags & Labels',
    description: 'Manage asset tags and labels for better organization.',
    icon: TagIcon,
    href: '/settings/tags',
    color: 'bg-indigo-500/10 text-indigo-400',
  },
  {
    id: 'workflows',
    name: 'Workflows',
    description: 'Define automation and approval processes for your assets.',
    icon: QueueListIcon,
    href: '/settings/workflows',
    color: 'bg-purple-500/10 text-purple-400',
  },
  {
    id: 'maintenance',
    name: 'Library Maintenance',
    description: 'Scan for duplicates, near-matches, and keep your library organized.',
    icon: CpuChipIcon,
    href: '/settings/maintenance',
    color: 'bg-amber-500/10 text-amber-400',
  },
  {
    id: 'trash',
    name: 'Trash',
    description: 'Recover or permanently delete items from your workspace.',
    icon: TrashIcon,
    href: '/settings/trash',
    color: 'bg-red-500/10 text-red-400',
  },
  {
    id: 'features',
    name: 'Project Features',
    description: 'Enable or disable advanced features like OCR and Text Extraction.',
    icon: AdjustmentsHorizontalIcon,
    href: '/settings/features',
    color: 'bg-emerald-500/10 text-emerald-400',
  },
  {
    id: 'announcement',
    name: 'Announcement Banner',
    description: 'Configure organization-wide announcement banners for all members.',
    icon: MegaphoneIcon,
    href: '/settings/announcement',
    color: 'bg-indigo-500/10 text-indigo-400',
  },
  {
    id: 'integrations',
    name: 'External Integrations',
    description: 'Connect Google Drive, S3, and other sources for zero-copy asset management.',
    icon: CloudArrowUpIcon,
    href: '/settings/integrations',
    color: 'bg-blue-600/10 text-blue-400',
  }
];

const ADMIN_ONLY_SECTION_IDS = [
  'maintenance',
  'features',
  'announcement',
];

export default function SettingsPage() {
  const { user } = usePermissions();
  const isSuperAdmin = user?.system_role === SystemRole.SUPER_ADMIN;

  const sections = BASE_SETTINGS_SECTIONS.filter(section => {
    if (ADMIN_ONLY_SECTION_IDS.includes(section.id)) {
      return isSuperAdmin;
    }
    return true;
  });

  if (isSuperAdmin) {
    sections.push({
      id: 'billing',
      name: 'Billing & Subscriptions',
      description: 'Manage your plan, billing history, and payment methods.',
      icon: CreditCardIcon,
      href: '/settings/billing',
      color: 'bg-rose-500/10 text-rose-400',
    });
  }

  return (
    <div className="max-w-5xl mx-auto py-10 px-6 animate-in fade-in duration-500">
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-white tracking-tight mb-2">Settings</h1>
        <p className="text-gray-400">Manage your workspace configuration and project preferences.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sections.map((section) => (
          <Link
            key={section.id}
            href={section.href}
            className="group p-6 bg-gray-900/40 border border-gray-800 rounded-2xl hover:bg-gray-800/60 hover:border-gray-700 transition-all duration-300 flex flex-col items-start gap-4 relative overflow-hidden"
          >
            <div className={`p-3 rounded-xl ${section.color} group-hover:scale-110 transition-transform duration-300`}>
              <section.icon className="h-6 w-6" />
            </div>

            <div className="flex flex-col gap-1">
              <h3 className="text-lg font-bold text-gray-200 group-hover:text-white transition-colors">
                {section.name}
              </h3>
              <p className="text-sm text-gray-400 line-clamp-2 leading-relaxed">
                {section.description}
              </p>
            </div>

            <div className="mt-2 text-xs font-bold text-blue-400 uppercase tracking-widest flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all translate-x-[-10px] group-hover:translate-x-0">
              Manage Settings
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="9 5l7 7-7 7" />
              </svg>
            </div>

            {/* Subtle background decoration */}
            <div className="absolute -right-4 -bottom-4 h-24 w-24 bg-gradient-to-br from-blue-500/5 to-transparent rounded-full blur-2xl group-hover:from-blue-500/10 transition-colors" />
          </Link>
        ))}
      </div>
      <DocumentationLink href="https://docs.zuperix.com/docs/admin/settings" />
    </div>
  );
}
