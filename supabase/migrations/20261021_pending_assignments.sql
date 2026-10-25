-- Faith Connect: assignments waiting for counsellors who have not signed in yet.
-- Safe to run more than once.

create table if not exists public.pending_assignments (
  id bigint generated always as identity primary key,
  contact_id bigint not null unique references public.contacts (id) on delete cascade,
  counsellor_name text not null,
  counsellor_email text,
  created_at timestamptz not null default now()
);

create index if not exists pending_assignments_email_idx on public.pending_assignments (lower(counsellor_email));
alter table public.pending_assignments enable row level security;

-- Lists shared on WhatsApp (October 2026), matched by phone. A person on two
-- lists stays with the first one. Records that only share a phone number with
-- someone on the list (including the 08000000000 placeholder) are left out.
-- Bro Andrew Urom's list was assigned directly.

insert into public.pending_assignments (contact_id, counsellor_name, counsellor_email)
select id, 'Bro Oluchukwu Ossai', 'ollyossai@gmail.com' from public.contacts
where id in (1684, 1683, 1680, 1672, 955, 1671, 1670, 1235, 1669, 1668, 1688, 1620, 1627) and assigned_counsellor_id is null
on conflict (contact_id) do nothing;

insert into public.pending_assignments (contact_id, counsellor_name, counsellor_email)
select id, 'Bro Sunday Ocholi', null from public.contacts
where id in (1626, 1620, 1627, 1618, 1615, 1612, 1691, 1679, 1678, 1674, 1662) and assigned_counsellor_id is null
on conflict (contact_id) do nothing;

insert into public.pending_assignments (contact_id, counsellor_name, counsellor_email)
select id, 'Bro Solomon Ekpa', null from public.contacts
where id in (1661, 1660, 1343, 1362, 1659, 1395, 1655, 1654, 1652, 1644, 1641, 1640, 1638) and assigned_counsellor_id is null
on conflict (contact_id) do nothing;

insert into public.pending_assignments (contact_id, counsellor_name, counsellor_email)
select id, 'Bro Philip Akogwu', null from public.contacts
where id in (1616, 1613, 1611, 1687, 1685, 1682, 1681, 1677, 1676, 1657) and assigned_counsellor_id is null
on conflict (contact_id) do nothing;

insert into public.pending_assignments (contact_id, counsellor_name, counsellor_email)
select id, 'Bro Joshua Monday', null from public.contacts
where id in (1650, 453, 747, 1649, 1646, 1635, 1634, 1632, 1629, 1614, 1675, 1690, 1689) and assigned_counsellor_id is null
on conflict (contact_id) do nothing;

insert into public.pending_assignments (contact_id, counsellor_name, counsellor_email)
select id, 'Bro Darlyton', null from public.contacts
where id in (1675, 1690, 1673, 1658, 1651, 1656, 1653, 1648, 1647, 1645, 1642) and assigned_counsellor_id is null
on conflict (contact_id) do nothing;

insert into public.pending_assignments (contact_id, counsellor_name, counsellor_email)
select id, 'Sis Omoh Ursula', 'omoursula@gmail.com' from public.contacts
where id in (1639, 1633, 1631, 1621, 1610, 1686, 1667, 1666, 1665) and assigned_counsellor_id is null
on conflict (contact_id) do nothing;

-- Anyone on the list who has already signed in gets their contacts now.
update public.contacts c
set assigned_counsellor_id = co.id, assigned_at = now()
from public.pending_assignments p
join public.counsellors co on lower(co.email) = lower(p.counsellor_email)
where c.id = p.contact_id and c.assigned_counsellor_id is null;

delete from public.pending_assignments p
using public.counsellors co
where lower(co.email) = lower(p.counsellor_email);
