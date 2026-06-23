'use client';

import { FormEvent } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Field, SelectInput, TextInput } from '@/components/ui/form';
import { buildFilterHref, formFilterFields } from '@/components/offers/filter-url';

export function OfferFilters({
  categories,
  tags,
  showDiscount = true,
  hiddenFields = []
}: {
  categories: Array<{ id: string; name: string }>;
  tags?: Array<{ id: string; name: string }>;
  showDiscount?: boolean;
  hiddenFields?: Array<{ name: string; value: string }>;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const formData = new FormData(event.currentTarget);
    const values = Object.fromEntries(
      [...formFilterFields, ...hiddenFields.map((field) => field.name)].map((field) => [
        field,
        String(formData.get(field) ?? '')
      ])
    );

    const href = buildFilterHref({
      pathname,
      currentSearch: searchParams.toString(),
      values,
      hiddenFieldNames: hiddenFields.map((field) => field.name)
    });

    router.replace(href, { scroll: false });
  }

  const currentValue = (name: string) => searchParams.get(name) ?? '';

  return (
    <form className="filter-bar" onSubmit={handleSubmit}>
      {hiddenFields.map((field) => (
        <input key={field.name} type="hidden" name={field.name} value={field.value} />
      ))}
      <Field label="Busca">
        <TextInput name="q" placeholder="Produto, cupom ou termo" defaultValue={currentValue('q')} />
      </Field>
      <Field label="Marketplace">
        <SelectInput name="marketplace" defaultValue={currentValue('marketplace')}>
          <option value="">Todos</option>
          <option value="manual">Manual</option>
          <option value="mercado_livre">Mercado Livre</option>
          <option value="shopee">Shopee</option>
        </SelectInput>
      </Field>
      <Field label="Categoria">
        <SelectInput name="categoryId" defaultValue={currentValue('categoryId')}>
          <option value="">Todas</option>
          {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
        </SelectInput>
      </Field>
      {tags ? (
        <Field label="Tag">
          <SelectInput name="tagId" defaultValue={currentValue('tagId')}>
            <option value="">Todas</option>
            {tags.map((tag) => <option key={tag.id} value={tag.id}>{tag.name}</option>)}
          </SelectInput>
        </Field>
      ) : null}
      <Field label="Score minimo">
        <TextInput name="minScore" inputMode="numeric" placeholder="0-100" defaultValue={currentValue('minScore')} />
      </Field>
      {showDiscount ? (
        <Field label="Desconto minimo">
          <TextInput name="minDiscount" inputMode="numeric" placeholder="0-100" defaultValue={currentValue('minDiscount')} />
        </Field>
      ) : null}
      <Button type="submit" variant="secondary">Filtrar</Button>
    </form>
  );
}
