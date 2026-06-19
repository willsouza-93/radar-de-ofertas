import { redirect } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Field, TextInput } from '@/components/ui/form';
import { signInAction } from '@/server/ui/actions';
import { getCurrentUserSession } from '@/server/ui/session';

export const dynamic = 'force-dynamic';

export default async function LoginPage({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const session = await getCurrentUserSession();
  if (session.state === 'authenticated') redirect('/dashboard');
  const params = searchParams ? await searchParams : {};
  const error = typeof params.error === 'string' ? params.error : null;

  return (
    <main className="login-page">
      <section className="card auth-card glass">
        <div className="brand">
          <span className="brand-mark">R</span>
          <span>Radar de Ofertas</span>
        </div>
        <h1>Entre no Radar de Ofertas</h1>
        <p className="muted">Acesse a curadoria e aprove as melhores oportunidades.</p>
        {error ? (
          <p role="alert" style={{ color: 'var(--danger)' }}>
            {error === 'config' ? 'Ambiente Supabase nao configurado.' : 'Email ou senha invalidos.'}
          </p>
        ) : null}
        <form action={signInAction} className="grid">
          <Field label="Email">
            <TextInput type="email" name="email" autoComplete="email" required />
          </Field>
          <Field label="Senha">
            <TextInput type="password" name="password" autoComplete="current-password" required />
          </Field>
          <div className="action-bar" style={{ justifyContent: 'space-between' }}>
            <label className="muted"><input type="checkbox" name="remember" /> Lembrar de mim</label>
            <span className="muted">Esqueci minha senha</span>
          </div>
          <Button type="submit">Entrar</Button>
        </form>
      </section>
    </main>
  );
}
