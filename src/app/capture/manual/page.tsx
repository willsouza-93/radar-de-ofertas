import Link from 'next/link';

import { ErrorState } from '@/components/feedback/error-state';
import { PageHeader } from '@/components/layout/app-shell';
import { ProtectedShell } from '@/components/layout/protected-shell';
import { Button } from '@/components/ui/button';
import { Field, Textarea } from '@/components/ui/form';
import { importManualOffersAction } from '@/server/ui/actions';

export const dynamic = 'force-dynamic';

const samplePayload = `{
  "records": [
    {
      "title": "Notebook Pro 14 16GB SSD 512GB",
      "sourceUrl": "https://example.com/produtos/notebook-pro-14?utm_source=demo",
      "affiliateUrl": "https://example.com/afiliado/notebook-pro-14",
      "externalId": "manual-notebook-pro-14",
      "currentPrice": "3999.90",
      "previousPrice": "4599.90",
      "couponCode": "NOTE10",
      "freeShipping": true,
      "commissionPercent": "8.5",
      "sellerName": "Loja Oficial",
      "availability": "in_stock"
    }
  ]
}`;

export default function ManualCapturePage({
  searchParams
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  return (
    <ProtectedShell currentPath="/capture/manual">
      {async ({ session }) => {
        const params = searchParams ? await searchParams : {};
        const result = readResult(params);

        if (session.user.role !== 'admin') {
          return (
            <>
              <PageHeader
                title="Importacao manual"
                description="Apenas Admin pode executar captura manual."
              />
              <ErrorState
                title="Acesso restrito"
                description="Editors podem revisar curadoria, mas nao capturar ou alterar ofertas."
                action={<Button as={Link} href="/dashboard" variant="secondary">Voltar ao dashboard</Button>}
              />
            </>
          );
        }

        return (
          <>
            <PageHeader
              eyebrow="Captura"
              title="Importacao manual"
              description="Cole um JSON estruturado para validar o connector manual, pipeline de captura e persistencia local."
              action={<Button as={Link} href="/offers" variant="secondary">Ver ofertas</Button>}
            />

            <section className="grid grid-detail">
              <form action={importManualOffersAction} className="card">
                <div className="section-heading">
                  <div>
                    <p className="eyebrow">JSON</p>
                    <h2>Entrada do connector manual</h2>
                  </div>
                  <span className="badge badge-neutral">Admin</span>
                </div>
                <Field
                  label="Payload"
                  helper="Use records[]. sourceUrl e currentPrice sao obrigatorios. affiliateUrl e opcional no dominio, mas o schema atual de offers exige affiliateUrl para persistir novas ofertas."
                >
                  <Textarea
                    name="payload"
                    rows={18}
                    defaultValue={samplePayload}
                    spellCheck={false}
                  />
                </Field>
                <div className="action-bar" style={{ marginTop: '1rem' }}>
                  <Button type="submit">Executar import manual</Button>
                </div>
              </form>

              <aside className="card">
                <div className="section-heading">
                  <div>
                    <p className="eyebrow">Resultado</p>
                    <h2>Ultima execucao</h2>
                  </div>
                </div>
                {result.kind === 'success' ? (
                  <div className="compact-list">
                    <Metric label="Recebidas" value={result.received} />
                    <Metric label="Persistidas" value={result.persisted} />
                    <Metric label="Invalidas" value={result.invalid} />
                    <Metric label="Fila criada" value={result.queueCreated} />
                    <Metric label="Reentrada solicitada" value={result.queueReentered} />
                    <Metric label="Fila ignorada/bloqueada" value={result.queueSkipped} />
                    <Metric label="Avisos" value={result.warnings} />
                    <p className="helper">Run: {result.run}</p>
                  </div>
                ) : result.kind === 'error' ? (
                  <ErrorState
                    title="Import nao executado"
                    description={describeError(result.error)}
                  />
                ) : (
                  <p className="muted">
                    Nenhuma execucao nesta sessao. O resultado aparece aqui apos o envio.
                  </p>
                )}

                <div className="section-spaced">
                  <p className="helper">
                    Observacao: a criacao/reentrada de `approval_queue` respeita os grants atuais.
                    Como a curadoria foi endurecida, ambientes sem funcao controlada podem persistir
                    ofertas e snapshots sem materializar nova fila.
                  </p>
                </div>
              </aside>
            </section>
          </>
        );
      }}
    </ProtectedShell>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="compact-item">
      <span className="muted">{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function readResult(params: Record<string, string | string[] | undefined>):
  | { kind: 'empty' }
  | { kind: 'error'; error: string }
  | {
      kind: 'success';
      received: string;
      persisted: string;
      invalid: string;
      queueCreated: string;
      queueReentered: string;
      queueSkipped: string;
      warnings: string;
      run: string;
    } {
  const error = single(params.error);
  if (error) return { kind: 'error', error };
  if (single(params.imported) !== '1') return { kind: 'empty' };

  return {
    kind: 'success',
    received: single(params.received) ?? '0',
    persisted: single(params.persisted) ?? '0',
    invalid: single(params.invalid) ?? '0',
    queueCreated: single(params.queueCreated) ?? '0',
    queueReentered: single(params.queueReentered) ?? '0',
    queueSkipped: single(params.queueSkipped) ?? '0',
    warnings: single(params.warnings) ?? '0',
    run: single(params.run) ?? '-'
  };
}

function single(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

function describeError(code: string): string {
  if (code === 'FORBIDDEN') return 'Somente Admin ativo do workspace pode executar import manual.';
  if (code === 'VALIDATION_ERROR') return 'Revise o JSON informado e tente novamente.';
  if (code === 'MULTIPLE_WORKSPACES_NOT_SUPPORTED') return 'A conta possui mais de um workspace ativo; selecao ainda nao faz parte do MVP.';
  return 'Falha inesperada ao executar import manual.';
}
