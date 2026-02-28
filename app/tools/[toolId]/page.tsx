import { notFound } from 'next/navigation';
import { tools } from '@/lib/tools/registry';
import { AppShell } from '@/components/layout/AppShell';

export function generateStaticParams() {
  return tools.map((tool) => ({ toolId: tool.id }));
}

export default function ToolPage({ params }: { params: { toolId: string } }) {
  if (!tools.some((t) => t.id === params.toolId)) notFound();
  return <AppShell toolId={params.toolId} />;
}
