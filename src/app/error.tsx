'use client';

import { Button } from '@/components/ui/button';
import { ErrorState } from '@/components/feedback/error-state';

export default function AppError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="login-page">
      <ErrorState
        title="Nao foi possivel carregar esta area."
        description="Tente novamente. Se persistir, fale com o administrador."
        action={<Button onClick={reset}>Tentar novamente</Button>}
      />
    </main>
  );
}
