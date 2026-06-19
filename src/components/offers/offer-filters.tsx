import { Button } from '@/components/ui/button';
import { Field, SelectInput, TextInput } from '@/components/ui/form';

export function OfferFilters({
  categories,
  tags,
  showDiscount = true
}: {
  categories: Array<{ id: string; name: string }>;
  tags?: Array<{ id: string; name: string }>;
  showDiscount?: boolean;
}) {
  return (
    <form className="filter-bar">
      <Field label="Busca">
        <TextInput name="q" placeholder="Produto, cupom ou termo" />
      </Field>
      <Field label="Marketplace">
        <SelectInput name="marketplace" defaultValue="">
          <option value="">Todos</option>
          <option value="manual">Manual</option>
          <option value="mercado_livre">Mercado Livre</option>
          <option value="shopee">Shopee</option>
        </SelectInput>
      </Field>
      <Field label="Categoria">
        <SelectInput name="categoryId" defaultValue="">
          <option value="">Todas</option>
          {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
        </SelectInput>
      </Field>
      {tags ? (
        <Field label="Tag">
          <SelectInput name="tagId" defaultValue="">
            <option value="">Todas</option>
            {tags.map((tag) => <option key={tag.id} value={tag.id}>{tag.name}</option>)}
          </SelectInput>
        </Field>
      ) : null}
      <Field label="Score minimo">
        <TextInput name="minScore" inputMode="numeric" placeholder="0-100" />
      </Field>
      {showDiscount ? (
        <Field label="Desconto minimo">
          <TextInput name="minDiscount" inputMode="numeric" placeholder="0-100" />
        </Field>
      ) : null}
      <Button type="submit" variant="secondary">Filtrar</Button>
    </form>
  );
}
