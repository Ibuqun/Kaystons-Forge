import { redirect } from 'next/navigation';
import { defaultToolId } from '@/lib/tools/registry';

export default function Page() {
  redirect(`/tools/${defaultToolId}`);
}
