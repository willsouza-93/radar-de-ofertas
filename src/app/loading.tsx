import { LoadingState } from '@/components/feedback/loading-state';

export default function Loading() {
  return (
    <main className="login-page">
      <LoadingState label="Carregando Radar de Ofertas..." />
    </main>
  );
}
