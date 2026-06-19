-- DEMO ONLY.
-- Rich local dataset for validating the Phase 4B UI.
-- Do not apply this file to staging or production.
-- This file intentionally stays separate from supabase/seed.sql.

do $$
declare
  workspace_a constant uuid := 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa';
  admin_user constant uuid := '10000000-0000-0000-0000-000000000001';
  editor_user constant uuid := '10000000-0000-0000-0000-000000000002';
begin
  if not exists (select 1 from public.workspaces where id = workspace_a) then
    raise exception 'Demo seed requires supabase/seed.sql to run first.';
  end if;

  delete from public.review_notes where id::text like 'a2000000-%';
  delete from public.approval_decisions where id::text like 'a1000000-%';

  update public.approval_queue
  set
    status = 'pending',
    last_decision_id = null,
    last_reviewed_by = null,
    last_reviewed_at = null
  where id::text like 'f0000000-%';

  delete from public.approval_queue where id::text like 'f0000000-%';
  delete from public.price_snapshots where offer_id::text like 'e0000000-%';
  delete from public.offer_tags where offer_id::text like 'e0000000-%';
  delete from public.offers where id::text like 'e0000000-%';
  delete from public.tags where id::text like 'd0000000-%';
  delete from public.categories where id::text like 'c0000000-%';

  insert into public.categories (id, workspace_id, name, slug, color, is_active)
  select
    ('c0000000-0000-0000-0000-' || lpad(item.ordinal::text, 12, '0'))::uuid,
    workspace_a,
    item.name,
    item.slug,
    item.color,
    true
  from (
    values
      (1, 'Tecnologia', 'tecnologia-demo', '#2563EB'),
      (2, 'Informatica', 'informatica-demo', '#4F46E5'),
      (3, 'Perifericos', 'perifericos-demo', '#7C3AED'),
      (4, 'Eletrodomesticos', 'eletrodomesticos-demo', '#0F766E'),
      (5, 'Games', 'games-demo', '#DB2777'),
      (6, 'Casa', 'casa-demo', '#16A34A'),
      (7, 'Escritorio', 'escritorio-demo', '#475569'),
      (8, 'Audio', 'audio-demo', '#0891B2'),
      (9, 'Smart Home', 'smart-home-demo', '#EA580C'),
      (10, 'Mercado', 'mercado-demo', '#CA8A04')
  ) as item(ordinal, name, slug, color);

  insert into public.tags (id, workspace_id, name, slug, color, is_active)
  select
    ('d0000000-0000-0000-0000-' || lpad(item.ordinal::text, 12, '0'))::uuid,
    workspace_a,
    item.name,
    item.slug,
    item.color,
    true
  from (
    values
      (1, 'Menor preco', 'menor-preco-demo', '#2563EB'),
      (2, 'Cupom validado', 'cupom-validado-demo', '#EA580C'),
      (3, 'Frete gratis', 'frete-gratis-demo', '#059669'),
      (4, 'Alta comissao', 'alta-comissao-demo', '#9333EA'),
      (5, 'Custo-beneficio', 'custo-beneficio-demo', '#0F766E'),
      (6, 'Volta as aulas', 'volta-as-aulas-demo', '#4F46E5'),
      (7, 'Setup gamer', 'setup-gamer-demo', '#DB2777'),
      (8, 'Home office', 'home-office-demo', '#475569'),
      (9, 'Casa inteligente', 'casa-inteligente-demo', '#0891B2'),
      (10, 'Oferta relampago', 'oferta-relampago-demo', '#DC2626'),
      (11, 'Preco suspeito', 'preco-suspeito-demo', '#B45309'),
      (12, 'Revisar duplicidade', 'revisar-duplicidade-demo', '#64748B'),
      (13, 'Excelente desconto', 'excelente-desconto-demo', '#15803D'),
      (14, 'Baixo estoque', 'baixo-estoque-demo', '#7C2D12'),
      (15, 'Produto premium', 'produto-premium-demo', '#1D4ED8'),
      (16, 'Entrada manual', 'entrada-manual-demo', '#64748B'),
      (17, 'Shopee', 'shopee-demo', '#F97316'),
      (18, 'Mercado Livre', 'mercado-livre-demo', '#FACC15'),
      (19, 'Pix desconto', 'pix-desconto-demo', '#14B8A6'),
      (20, 'Validacao UX', 'validacao-ux-demo', '#111827')
  ) as item(ordinal, name, slug, color);

  insert into public.offers (
    id,
    workspace_id,
    marketplace,
    external_id,
    dedupe_key,
    source_url,
    affiliate_url,
    title,
    image_url,
    category_id,
    current_price,
    previous_price,
    currency,
    discount_percent,
    coupon_code,
    free_shipping,
    commission_percent,
    score,
    score_version,
    score_factors,
    highlights,
    status,
    captured_at,
    last_seen_at,
    created_by,
    updated_by
  )
  select
    offer_id,
    workspace_a,
    marketplace,
    'DEMO-' || lpad(i::text, 3, '0'),
    marketplace::text || ':external:DEMO-' || lpad(i::text, 3, '0'),
    'https://demo.radar.local/ofertas/' || lpad(i::text, 3, '0'),
    'https://demo.radar.local/afiliado/' || lpad(i::text, 3, '0'),
    title,
    null,
    category_id,
    current_price,
    previous_price,
    'BRL',
    discount_percent,
    coupon_code,
    free_shipping,
    commission_percent,
    score,
    'mvp-v1',
    jsonb_build_object(
      'version', 'mvp-v1',
      'discount', jsonb_build_object('points', least(35, greatest(0, round(discount_percent * 0.7)::int)), 'max', 35),
      'priceHistory', jsonb_build_object('points', case when score >= 75 then 26 when score >= 55 then 16 else 6 end, 'max', 30),
      'commission', jsonb_build_object('points', least(20, greatest(0, round(coalesce(commission_percent, 0) * 1.4)::int)), 'max', 20),
      'completeness', jsonb_build_object('points', 15, 'max', 15)
    ),
    array_remove(array[
      case when score >= 88 then 'lowest_price'::public.offer_highlight end,
      case when coupon_code is not null then 'coupon'::public.offer_highlight end,
      case when free_shipping then 'free_shipping'::public.offer_highlight end,
      case when commission_percent >= 11 then 'high_commission'::public.offer_highlight end
    ], null),
    'captured',
    captured_at,
    captured_at + interval '40 minutes',
    admin_user,
    admin_user
  from (
    select
      i,
      ('e0000000-0000-0000-0000-' || lpad(i::text, 12, '0'))::uuid as offer_id,
      ('c0000000-0000-0000-0000-' || lpad((((i - 1) % 10) + 1)::text, 12, '0'))::uuid as category_id,
      case (i % 3)
        when 0 then 'mercado_livre'::public.offer_marketplace
        when 1 then 'shopee'::public.offer_marketplace
        else 'manual'::public.offer_marketplace
      end as marketplace,
      case
        when i <= 16 then 25 + (i % 25)
        when i <= 40 then 55 + (i % 20)
        else 78 + (i % 20)
      end as score,
      case
        when i <= 16 then 6 + (i % 9)
        when i <= 40 then 18 + (i % 12)
        else 34 + (i % 22)
      end::numeric(5,2) as discount_percent,
      round((59 + (i * 17.35))::numeric, 2) as current_price,
      round(((59 + (i * 17.35)) / (1 - (
        case
          when i <= 16 then 6 + (i % 9)
          when i <= 40 then 18 + (i % 12)
          else 34 + (i % 22)
        end
      )::numeric / 100))::numeric, 2) as previous_price,
      case when i % 4 = 0 then 'DEMO' || lpad(i::text, 2, '0') end as coupon_code,
      i % 3 = 0 as free_shipping,
      case when i % 5 = 0 then 12.50 when i % 2 = 0 then 8.00 else 4.00 end::numeric(5,2) as commission_percent,
      timestamp with time zone '2026-06-01 09:00:00+00' + (i || ' hours')::interval as captured_at,
      (array[
        'Monitor 27 polegadas para produtividade',
        'Teclado mecanico compacto ABNT2',
        'Mouse gamer RGB de alta precisao',
        'Headset sem fio com microfone',
        'Notebook ultrafino para home office',
        'SSD NVMe 1TB para upgrade',
        'Air fryer digital 5 litros',
        'Cafeteira espresso compacta',
        'Echo speaker para casa inteligente',
        'Lampada smart Wi-Fi colorida',
        'Cadeira ergonomica para escritorio',
        'Webcam Full HD com microfone',
        'Controle sem fio para PC e console',
        'Roteador mesh dual band',
        'Aspirador robo com mapeamento',
        'Filtro de linha com USB-C'
      ])[((i - 1) % 16) + 1] || ' #' || lpad(i::text, 2, '0') as title
    from generate_series(1, 64) as i
  ) as generated_offers
  on conflict (id) do update
  set
    marketplace = excluded.marketplace,
    external_id = excluded.external_id,
    dedupe_key = excluded.dedupe_key,
    source_url = excluded.source_url,
    affiliate_url = excluded.affiliate_url,
    title = excluded.title,
    image_url = excluded.image_url,
    category_id = excluded.category_id,
    current_price = excluded.current_price,
    previous_price = excluded.previous_price,
    currency = excluded.currency,
    discount_percent = excluded.discount_percent,
    coupon_code = excluded.coupon_code,
    free_shipping = excluded.free_shipping,
    commission_percent = excluded.commission_percent,
    score = excluded.score,
    score_version = excluded.score_version,
    score_factors = excluded.score_factors,
    highlights = excluded.highlights,
    status = excluded.status,
    captured_at = excluded.captured_at,
    last_seen_at = excluded.last_seen_at,
    updated_by = excluded.updated_by;

  insert into public.offer_tags (workspace_id, offer_id, tag_id)
  select
    workspace_a,
    ('e0000000-0000-0000-0000-' || lpad(i::text, 12, '0'))::uuid,
    ('d0000000-0000-0000-0000-' || lpad(tag_number::text, 12, '0'))::uuid
  from generate_series(1, 64) as i
  cross join lateral (
    values
      (((i - 1) % 20) + 1),
      (((i + 6) % 20) + 1),
      (((i + 13) % 20) + 1)
  ) as tags(tag_number)
  on conflict (offer_id, tag_id) do nothing;

  insert into public.price_snapshots (
    workspace_id,
    offer_id,
    price,
    previous_price,
    discount_percent,
    coupon_code,
    free_shipping,
    observed_at
  )
  select
    workspace_a,
    offer.id,
    round((offer.current_price * 1.08)::numeric, 2),
    offer.previous_price,
    greatest(0, offer.discount_percent - 5),
    null,
    offer.free_shipping,
    offer.captured_at - interval '2 days'
  from public.offers as offer
  where offer.workspace_id = workspace_a
    and offer.id::text like 'e0000000-%'
    and right(offer.id::text, 1)::int % 2 = 0
  on conflict (offer_id, observed_at) do update
  set
    price = excluded.price,
    previous_price = excluded.previous_price,
    discount_percent = excluded.discount_percent,
    coupon_code = excluded.coupon_code,
    free_shipping = excluded.free_shipping;

  insert into public.price_snapshots (
    workspace_id,
    offer_id,
    price,
    previous_price,
    discount_percent,
    coupon_code,
    free_shipping,
    observed_at
  )
  select
    workspace_a,
    offer.id,
    offer.current_price,
    offer.previous_price,
    offer.discount_percent,
    offer.coupon_code,
    offer.free_shipping,
    offer.captured_at
  from public.offers as offer
  where offer.workspace_id = workspace_a
    and offer.id::text like 'e0000000-%'
  on conflict (offer_id, observed_at) do update
  set
    price = excluded.price,
    previous_price = excluded.previous_price,
    discount_percent = excluded.discount_percent,
    coupon_code = excluded.coupon_code,
    free_shipping = excluded.free_shipping;

  insert into public.approval_queue (
    id,
    workspace_id,
    offer_id,
    status,
    priority_score,
    created_at,
    updated_at
  )
  select
    ('f0000000-0000-0000-0000-' || lpad(i::text, 12, '0'))::uuid,
    workspace_a,
    ('e0000000-0000-0000-0000-' || lpad(i::text, 12, '0'))::uuid,
    'pending',
    case
      when i <= 16 then 25 + (i % 25)
      when i <= 40 then 55 + (i % 20)
      else 78 + (i % 20)
    end,
    timestamp with time zone '2026-06-03 09:00:00+00' + (i || ' hours')::interval,
    timestamp with time zone '2026-06-03 09:00:00+00' + (i || ' hours')::interval
  from generate_series(1, 64) as i
  on conflict (id) do update
  set
    priority_score = excluded.priority_score,
    updated_at = excluded.updated_at;

  insert into public.approval_decisions (
    id,
    workspace_id,
    queue_id,
    offer_id,
    decision,
    previous_status,
    next_status,
    reason,
    decided_by,
    decided_at,
    created_at
  )
  select
    ('a1000000-0000-0000-0000-' || lpad(i::text, 12, '0'))::uuid,
    workspace_a,
    ('f0000000-0000-0000-0000-' || lpad(i::text, 12, '0'))::uuid,
    ('e0000000-0000-0000-0000-' || lpad(i::text, 12, '0'))::uuid,
    case when i between 15 and 39 then 'approved' else 'rejected' end::public.approval_decision_type,
    'pending',
    case when i between 15 and 39 then 'approved' else 'rejected' end::public.approval_status,
    case
      when i between 15 and 39 then null
      when i % 5 = 0 then 'Desconto insuficiente para o canal principal.'
      when i % 5 = 1 then 'Preco suspeito em relacao ao historico recente.'
      when i % 5 = 2 then 'Oferta duplicada ja apareceu na fila desta semana.'
      when i % 5 = 3 then 'Produto fora do escopo editorial do momento.'
      else 'Comissao baixa e pouco apelo para publicacao.'
    end,
    case when i % 2 = 0 then admin_user else editor_user end,
    timestamp with time zone '2026-06-05 10:00:00+00' + (i || ' hours')::interval,
    timestamp with time zone '2026-06-05 10:00:00+00' + (i || ' hours')::interval
  from generate_series(15, 64) as i
  on conflict (id) do update
  set
    decision = excluded.decision,
    previous_status = excluded.previous_status,
    next_status = excluded.next_status,
    reason = excluded.reason,
    decided_by = excluded.decided_by,
    decided_at = excluded.decided_at,
    created_at = excluded.created_at;

  update public.approval_queue as queue
  set
    status = decision.next_status,
    last_decision_id = decision.id,
    last_reviewed_by = decision.decided_by,
    last_reviewed_at = decision.decided_at,
    updated_at = decision.decided_at
  from public.approval_decisions as decision
  where queue.workspace_id = workspace_a
    and queue.id = decision.queue_id
    and decision.id::text like 'a1000000-%';

  insert into public.review_notes (
    id,
    workspace_id,
    queue_id,
    offer_id,
    body,
    created_by,
    created_at
  )
  select
    ('a2000000-0000-0000-0000-' || lpad(i::text, 12, '0'))::uuid,
    workspace_a,
    ('f0000000-0000-0000-0000-' || lpad(i::text, 12, '0'))::uuid,
    ('e0000000-0000-0000-0000-' || lpad(i::text, 12, '0'))::uuid,
    case
      when i <= 14 and i % 3 = 0 then 'Pendente: validar cupom no aplicativo antes de decidir.'
      when i <= 14 and i % 3 = 1 then 'Pendente: oportunidade relevante, conferir disponibilidade do estoque.'
      when i <= 14 then 'Pendente: score bom, revisar se o preco se manteve.'
      when i between 15 and 39 and i % 4 = 0 then 'Aprovada: excelente custo-beneficio e frete competitivo.'
      when i between 15 and 39 and i % 4 = 1 then 'Aprovada: desconto consistente com menor preco observado.'
      when i between 15 and 39 and i % 4 = 2 then 'Aprovada: produto combina com pauta de home office.'
      when i between 15 and 39 then 'Aprovada: boa oportunidade para validacao de fluxo editorial.'
      when i % 5 = 0 then 'Rejeitada: desconto insuficiente para gerar urgencia.'
      when i % 5 = 1 then 'Rejeitada: preco suspeito comparado ao historico.'
      when i % 5 = 2 then 'Rejeitada: possivel oferta duplicada.'
      when i % 5 = 3 then 'Rejeitada: produto fora do escopo da curadoria atual.'
      else 'Rejeitada: baixo potencial de conversao.'
    end,
    case when i % 2 = 0 then admin_user else editor_user end,
    timestamp with time zone '2026-06-05 09:40:00+00' + (i || ' hours')::interval
  from generate_series(1, 64) as i
  on conflict (id) do update
  set
    body = excluded.body,
    created_by = excluded.created_by,
    created_at = excluded.created_at;
end $$;
