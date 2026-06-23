import Link from 'next/link';

import { Button } from '@/components/ui/button';
import { EmptyState } from '@/components/feedback/empty-state';

export default function NotFoundPage() {
  return (
    <main className="login-page">
      <EmptyState
        title="Esta pagina saiu do radar."
        description="O caminho nao existe ou foi movido."
        action={<Button as={Link} href="/dashboard" variant="primary">Voltar ao dashboard</Button>}
      />
    </main>
  );
}
