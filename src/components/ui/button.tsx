import type { ComponentPropsWithoutRef, ElementType, ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';

type ButtonProps<TElement extends ElementType> = {
  as?: TElement;
  variant?: ButtonVariant;
  isLoading?: boolean;
  children: ReactNode;
} & Omit<ComponentPropsWithoutRef<TElement>, 'as' | 'children'>;

const variantClass: Record<ButtonVariant, string> = {
  primary: 'button-primary',
  secondary: 'button-secondary',
  ghost: 'button-ghost',
  danger: 'button-danger'
};

export function Button<TElement extends ElementType = 'button'>({
  as,
  variant = 'primary',
  isLoading = false,
  className,
  children,
  ...props
}: ButtonProps<TElement>) {
  const Component = as ?? 'button';
  const composedClassName = ['button', variantClass[variant], className].filter(Boolean).join(' ');

  return (
    <Component className={composedClassName} aria-busy={isLoading || undefined} {...props}>
      {isLoading ? 'Carregando...' : children}
    </Component>
  );
}
