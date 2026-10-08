-- Catalog copied verbatim from content/salon.ts. Existing rows are preserved.
-- Apply with execute_sql (data only), after all migrations.
begin;

insert into public.services (id, slug, name, category, description, duration, price, image, sort_order) values
  ('corte', 'corte-autoral', 'Corte autoral', 'Cortes', 'Forma, movimento e personalidade. Um corte pensado para a sua textura e o seu dia a dia.', 60, 180, '/images/service-haircut.jpg', 0),
  ('cor', 'coloracao-personalizada', 'Coloração personalizada', 'Coloração', 'Nuances que conversam com você. Cor sob medida, com atenção à integridade dos fios.', 120, 320, '/images/service-color.jpg', 1),
  ('balayage', 'balayage', 'Balayage & luz', 'Balayage', 'Luz em lugares certos. Dimensão, naturalidade e um crescimento suave.', 180, 620, '/images/service-balayage.jpg', 2),
  ('tratamento', 'ritual-de-tratamento', 'Ritual de tratamento', 'Tratamentos', 'Uma pausa para recuperar. Nutrição, força e toque macio, na medida do seu cabelo.', 60, 160, '/images/service-treatment.jpg', 3),
  ('finalizacao', 'finalizacao-e-penteados', 'Finalização & penteados', 'Finalização', 'Do natural ao especial. Textura e acabamento para os seus momentos.', 60, 140, '/images/service-styling.jpg', 4),
  ('extensoes', 'extensoes', 'Extensões naturais', 'Extensões', 'Mais possibilidades. Volume e comprimento integrados ao seu estilo.', 240, 980, '/images/service-extensions.jpg', 5)
on conflict (id) do nothing;

-- Homepage summaries and photos, as in migration site_content_and_catalog_editing.
update public.services s set
  summary = v.summary,
  home_image = v.home_image,
  home_image_alt = v.home_image_alt,
  home_image_position = v.home_image_position
from (values
  ('corte', 'Forma e movimento para sua textura natural.', '/images/home-service-haircut.jpg', 'Detalhe de corte com tesoura e pente', '50% 50%'),
  ('cor', 'Nuances sob medida para o seu estilo.', '/images/home-service-color.jpg', 'Coloração aplicada por uma profissional no salão', '50% 50%'),
  ('balayage', 'Luz e dimensão com transições suaves.', '/images/home-service-balayage.jpg', 'Referência de cabelo loiro com ondas e nuances de luz', '85% 50%'),
  ('tratamento', 'Cuidado para devolver vida aos fios.', '/images/home-service-treatment.jpg', 'Cuidado dos fios durante a lavagem no salão', '50% 50%'),
  ('finalizacao', 'Ondas e penteados para cada ocasião.', '/images/home-service-styling.jpg', 'Modelagem de ondas em cabelo castanho', '50% 50%'),
  ('extensoes', 'Comprimento e volume com efeito natural.', '/images/home-service-extensions.jpg', 'Referência de comprimento e volume em cabelo longo ondulado', '50% 50%')
) as v(id, summary, home_image, home_image_alt, home_image_position)
where s.id = v.id and s.home_image is null and s.summary = '';

insert into public.stylists (id, slug, name, role, experience, specialties, description, biography, image, sort_order) values
  ('lia', 'lia-monteiro', 'Lia Monteiro', 'Diretora criativa · cortes', 12, '{"Cortes autorais","Texturas naturais","Visagismo"}', 'Cortes com movimento e uma escuta atenta. Lia acredita que o melhor visual é aquele que acompanha você.', 'Lia é a fundadora e a mente criativa do ateliê. Sua abordagem combina precisão e sensibilidade para criar formas que valorizam a textura natural. O ponto de partida é sempre a conversa: como você vive, como gosta de se ver e quanto tempo quer dedicar ao cabelo.', '/images/stylist-01.jpg', 0),
  ('rafael', 'rafael-costa', 'Rafael Costa', 'Especialista em cor', 10, '{"Balayage","Loiros naturais","Coloração"}', 'Cor que parece ter nascido com você. Rafael cria nuances luminosas e transições delicadas.', 'Rafael traduz referências em cores possíveis para cada cabelo. Sua especialidade são os contrastes sutis e o crescimento natural. A avaliação cuidadosa e o cuidado com os fios vêm antes de qualquer mudança.', '/images/stylist-02.jpg', 1),
  ('marina', 'marina-alves', 'Marina Alves', 'Especialista em textura', 8, '{"Cachos & ondas","Cortes","Rituais de cuidado"}', 'Respeito à sua textura, liberdade para seus fios. Marina encontra beleza no movimento natural.', 'O trabalho de Marina parte do respeito ao desenho de cada fio. Seu trabalho reflete a atenção que o Livre dedica a cabelos ondulados, cacheados e crespos. Ela orienta técnicas simples de finalização e propõe cortes que funcionam fora do salão.', '/images/stylist-03.jpg', 2),
  ('sofia', 'sofia-dias', 'Sofia Dias', 'Stylist · extensões e eventos', 9, '{"Extensões","Penteados","Finalização"}', 'Acabamentos delicados para transformar uma ocasião. Sofia cuida de cada detalhe sem perder sua essência.', 'Sofia une atenção aos detalhes e um olhar contemporâneo para penteados e extensões. Na equipe, desenvolve propostas naturais e confortáveis, com planejamento de manutenção e acabamento que respeita o estilo de cada pessoa.', '/images/stylist-04.jpg', 3)
on conflict (id) do nothing;

insert into public.stylist_services (stylist_id, service_id, sort_order) values
  ('lia', 'corte', 0),
  ('lia', 'tratamento', 1),
  ('lia', 'finalizacao', 2),
  ('rafael', 'cor', 0),
  ('rafael', 'balayage', 1),
  ('rafael', 'tratamento', 2),
  ('marina', 'corte', 0),
  ('marina', 'tratamento', 1),
  ('marina', 'finalizacao', 2),
  ('sofia', 'extensoes', 0),
  ('sofia', 'finalizacao', 1),
  ('sofia', 'tratamento', 2)
on conflict (stylist_id, service_id) do nothing;

insert into public.business_hours (weekday, active, opens_at, closes_at) values
  (0, false, null, null),
  (1, false, null, null),
  (2, true, '09:00', '19:00'),
  (3, true, '09:00', '19:00'),
  (4, true, '09:00', '19:00'),
  (5, true, '09:00', '19:00'),
  (6, true, '09:00', '19:00')
on conflict (weekday) do nothing;

-- Weekly periods used by booking; overlapping duplicates are skipped.
insert into public.opening_periods (weekday, opens_at, closes_at)
select weekday, opens_at, closes_at from public.business_hours where active
on conflict do nothing;

insert into public.salon_settings (id, show_prices, time_zone, booking_window_days, slot_interval_minutes, demo_commission_rate) values
  (true, true, 'America/Sao_Paulo', 30, 30, 0.5)
on conflict (id) do nothing;

commit;
