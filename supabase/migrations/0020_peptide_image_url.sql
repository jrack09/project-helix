-- Add primary image URL per drug and seed static asset mappings.

alter table public.peptides
add column if not exists image_url text;

update public.peptides
set image_url = case slug
  when 'semaglutide-wegovy' then '/drugs/semaglutide-wegovy.png'
  when 'semaglutide-ozempic' then '/drugs/semaglutide-ozempic.png'
  when 'tirzepatide-mounjaro' then '/drugs/tirzepatide-mounjaro.png'
  when 'tirzepatide-zepbound' then '/drugs/tirzepatide-zepbound.png'
  when 'cagrilintide' then '/drugs/cagrilintide.png'
  when 'liraglutide-saxenda' then '/drugs/liraglutide-saxenda.png'
  when 'mazdutide' then '/drugs/mazdutide.png'
  when 'bpc-157' then '/drugs/bpc-157.png'
  when 'retatrutide' then '/drugs/retatrutide.png'
  when 'aod-9604' then '/drugs/aod-9604.png'
  else image_url
end
where slug in (
  'semaglutide-wegovy',
  'semaglutide-ozempic',
  'tirzepatide-mounjaro',
  'tirzepatide-zepbound',
  'cagrilintide',
  'liraglutide-saxenda',
  'mazdutide',
  'bpc-157',
  'retatrutide',
  'aod-9604'
);
