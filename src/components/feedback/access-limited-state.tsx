import { Button } from '@/components/ui/button';
import { signOutAction } from '@/server/ui/actions';

export function AccessLimitedState({
  title = 'Seu acesso ao workspace nao esta ativo.',
  description = 'Se voce acredita que isso e um engano, fale com o administrador do workspace.'
}: {
  title?: string;
  description?: string;
}) {
  return (
    <main className="login-page">
      <section className="card auth-card" role="alert">
        <p className="eyebrow">Acesso limitado</p>
        <h1>{title}</h1>
        <p className="muted">{description}</p>
        <form action={signOutAction}>
          <Button type="submit" variant="secondary">Sair</Button>
        </form>
      </section>
    </main>
  );
}
