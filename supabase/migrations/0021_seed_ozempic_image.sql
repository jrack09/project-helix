-- Backfill image URL for Ozempic after initial image migration was applied.

update public.peptides
set image_url = '/drugs/semaglutide-ozempic.png'
where slug = 'semaglutide-ozempic';
