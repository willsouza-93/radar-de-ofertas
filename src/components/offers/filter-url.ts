export const formFilterFields = [
  'q',
  'marketplace',
  'categoryId',
  'tagId',
  'minScore',
  'minDiscount'
] as const;

export const secondaryFilterFields = [
  ...formFilterFields,
  'from',
  'to',
  'sort'
] as const;

export type RawFilterSearchParams = Record<string, string | string[] | undefined>;

export function buildFilterHref({
  pathname,
  currentSearch,
  values,
  hiddenFieldNames = []
}: {
  pathname: string;
  currentSearch: string;
  values: Record<string, string>;
  hiddenFieldNames?: string[];
}): string {
  const nextParams = new URLSearchParams(currentSearch);
  const fields = new Set<string>(formFilterFields);

  hiddenFieldNames.forEach((field) => fields.add(field));

  fields.forEach((field) => {
    const normalizedValue = values[field]?.trim() ?? '';

    if (normalizedValue) nextParams.set(field, normalizedValue);
    else nextParams.delete(field);
  });

  nextParams.delete('cursor');

  return buildHref(pathname, nextParams);
}

export function buildCurationStatusHref(
  params: RawFilterSearchParams,
  status: string
): string {
  const nextParams = toSearchParams(params);
  nextParams.set('status', status);
  nextParams.delete('cursor');

  return buildHref('/curation', nextParams);
}

export function buildClearFiltersHref({
  pathname,
  params,
  preserveStatus = false
}: {
  pathname: string;
  params: RawFilterSearchParams;
  preserveStatus?: boolean;
}): string {
  const nextParams = toSearchParams(params);
  const status = preserveStatus ? nextParams.get('status') : null;

  secondaryFilterFields.forEach((field) => nextParams.delete(field));
  nextParams.delete('cursor');

  if (preserveStatus && status) nextParams.set('status', status);
  else nextParams.delete('status');

  return buildHref(pathname, nextParams);
}

export function hasSecondaryFilters(params: RawFilterSearchParams): boolean {
  const searchParams = toSearchParams(params);
  return secondaryFilterFields.some((field) => Boolean(searchParams.get(field)));
}

function toSearchParams(params: RawFilterSearchParams): URLSearchParams {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (Array.isArray(value)) {
      value.forEach((entry) => {
        if (entry) searchParams.append(key, entry);
      });
      return;
    }

    if (value) searchParams.set(key, value);
  });

  return searchParams;
}

function buildHref(pathname: string, searchParams: URLSearchParams): string {
  const query = searchParams.toString();
  return query ? `${pathname}?${query}` : pathname;
}
