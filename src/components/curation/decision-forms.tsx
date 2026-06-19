import { addReviewNoteAction, approveOfferAction, rejectOfferAction } from '@/server/ui/actions';
import { Button } from '@/components/ui/button';
import { Field, Textarea } from '@/components/ui/form';

export function ReviewNoteComposer({ queueId }: { queueId: string }) {
  return (
    <form action={addReviewNoteAction} className="card">
      <input type="hidden" name="queueId" value={queueId} />
      <Field label="Adicionar observacao" helper="Observacoes sao permanentes no historico.">
        <Textarea name="body" placeholder="Ex.: cupom validado no app, mas desconto menor no desktop." required maxLength={2000} />
      </Field>
      <Button type="submit" variant="secondary">Adicionar observacao</Button>
    </form>
  );
}

export function DecisionForms({ queueId }: { queueId: string }) {
  return (
    <div className="grid">
      <form action={approveOfferAction} className="card">
        <input type="hidden" name="queueId" value={queueId} />
        <h2>Aprovar oferta?</h2>
        <p className="muted">A oferta ficara aprovada para uma fase futura de agendamento. Nada sera publicado agora.</p>
        <Field label="Nota opcional">
          <Textarea name="note" maxLength={2000} placeholder="Contexto opcional para o historico." />
        </Field>
        <Button type="submit" variant="primary">Aprovar oferta</Button>
      </form>
      <form action={rejectOfferAction} className="card">
        <input type="hidden" name="queueId" value={queueId} />
        <h2>Rejeitar oferta?</h2>
        <p className="muted">Informe o motivo para manter o historico de curadoria claro.</p>
        <Field label="Motivo da rejeicao">
          <Textarea name="reason" minLength={3} maxLength={2000} required placeholder="Explique por que a oferta nao deve seguir." />
        </Field>
        <Button type="submit" variant="danger">Rejeitar oferta</Button>
      </form>
    </div>
  );
}
