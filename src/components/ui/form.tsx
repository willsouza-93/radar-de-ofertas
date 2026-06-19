export function Field({
  label,
  helper,
  error,
  children
}: {
  label: string;
  helper?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
      {helper ? <small className="helper">{helper}</small> : null}
      {error ? <small role="alert" style={{ color: 'var(--danger)' }}>{error}</small> : null}
    </label>
  );
}

export function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input className="input" {...props} />;
}

export function SelectInput(props: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className="input" {...props} />;
}

export function Textarea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className="input textarea" {...props} />;
}
