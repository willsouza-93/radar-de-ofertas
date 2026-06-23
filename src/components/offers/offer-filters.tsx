'use client';

import { ChangeEvent, FormEvent, useEffect, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';

import { Button } from '@/components/ui/button';
import { Field, SelectInput, TextInput } from '@/components/ui/form';
import { buildFilterHref, buildSearchHref, formFilterFields } from '@/components/offers/filter-url';

const textSearchDebounceMs = 400;

type FilterFormValues = Record<(typeof formFilterFields)[number], string>;

function valuesFromSearchParams(searchParams: URLSearchParams): FilterFormValues {
  return {
    q: searchParams.get('q') ?? '',
    marketplace: searchParams.get('marketplace') ?? '',
    categoryId: searchParams.get('categoryId') ?? '',
    tagId: searchParams.get('tagId') ?? '',
    minScore: searchParams.get('minScore') ?? '',
    minDiscount: searchParams.get('minDiscount') ?? ''
  };
}

export function OfferFilters({
  categories,
  tags,
  showDiscount = true,
  hiddenFields = []
}: {
  categories: Array<{ id: string; name: string; label?: string }>;
  tags?: Array<{ id: string; name: string; label?: string }>;
  showDiscount?: boolean;
  hiddenFields?: Array<{ name: string; value: string }>;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const search = searchParams.toString();
  const [values, setValues] = useState<FilterFormValues>(() => valuesFromSearchParams(searchParams));
  const searchDebounceRef = useRef<number | null>(null);

  useEffect(() => {
    setValues(valuesFromSearchParams(searchParams));
  }, [search, searchParams]);

  useEffect(() => {
    if (values.q === (searchParams.get('q') ?? '')) return;

    if (searchDebounceRef.current) window.clearTimeout(searchDebounceRef.current);

    searchDebounceRef.current = window.setTimeout(() => {
      const href = buildSearchHref({
        pathname,
        currentSearch: search,
        query: values.q
      });

      if (href) router.replace(href, { scroll: false });
      searchDebounceRef.current = null;
    }, textSearchDebounceMs);

    return () => {
      if (searchDebounceRef.current) {
        window.clearTimeout(searchDebounceRef.current);
        searchDebounceRef.current = null;
      }
    };
  }, [pathname, router, search, searchParams, values.q]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (searchDebounceRef.current) {
      window.clearTimeout(searchDebounceRef.current);
      searchDebounceRef.current = null;
    }

    const submittedValues = {
      ...values,
      ...Object.fromEntries(hiddenFields.map((field) => [field.name, field.value]))
    };

    const href = buildFilterHref({
      pathname,
      currentSearch: search,
      values: submittedValues,
      hiddenFieldNames: hiddenFields.map((field) => field.name)
    });

    router.replace(href, { scroll: false });
  }

  function updateField(field: keyof FilterFormValues) {
    return (event: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      setValues((currentValues) => ({
        ...currentValues,
        [field]: event.target.value
      }));
    };
  }

  return (
    <form className="filter-bar" onSubmit={handleSubmit}>
      {hiddenFields.map((field) => (
        <input key={field.name} type="hidden" name={field.name} value={field.value} />
      ))}
      <Field label="Busca">
        <TextInput name="q" placeholder="Produto, cupom ou termo" value={values.q} onChange={updateField('q')} />
      </Field>
      <Field label="Marketplace">
        <SelectInput name="marketplace" value={values.marketplace} onChange={updateField('marketplace')}>
          <option value="">Todos</option>
          <option value="manual">Manual</option>
          <option value="mercado_livre">Mercado Livre</option>
          <option value="shopee">Shopee</option>
        </SelectInput>
      </Field>
      <Field label="Categoria">
        <SelectInput name="categoryId" value={values.categoryId} onChange={updateField('categoryId')}>
          <option value="">Todas</option>
          {categories.map((category) => <option key={category.id} value={category.id}>{category.label ?? category.name}</option>)}
        </SelectInput>
      </Field>
      {tags ? (
        <Field label="Tag">
          <SelectInput name="tagId" value={values.tagId} onChange={updateField('tagId')}>
            <option value="">Todas</option>
            {tags.map((tag) => <option key={tag.id} value={tag.id}>{tag.label ?? tag.name}</option>)}
          </SelectInput>
        </Field>
      ) : null}
      <Field label="Score minimo">
        <TextInput name="minScore" inputMode="numeric" placeholder="0-100" value={values.minScore} onChange={updateField('minScore')} />
      </Field>
      {showDiscount ? (
        <Field label="Desconto minimo">
          <TextInput name="minDiscount" inputMode="numeric" placeholder="0-100" value={values.minDiscount} onChange={updateField('minDiscount')} />
        </Field>
      ) : null}
      <Button type="submit" variant="secondary">Filtrar</Button>
    </form>
  );
}
