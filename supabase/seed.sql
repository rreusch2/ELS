-- Placeholder listings for development. Replace with real properties via the admin dashboard.

with new_listings as (
  insert into public.listings (
    slug, title, description, property_type, status, address_line1, city, state, zip,
    latitude, longitude, rent_cents, deposit_cents, bedrooms, bathrooms, square_feet,
    available_date, lease_term_months, pets_allowed, pet_policy, utilities_included, amenities, featured
  ) values
  (
    'riverfront-craftsman-3br', 'Riverfront Craftsman Home',
    'Charming 3-bedroom craftsman just blocks from the Ohio River and Audubon Mill Park. Original hardwood floors, a renovated kitchen with quartz countertops, and a large fenced backyard perfect for summer evenings. Walk to downtown Henderson shops and restaurants.',
    'house', 'available', '412 N Water St', 'Henderson', 'KY', '42420',
    37.8412, -87.5903, 145000, 145000, 3, 2, 1650,
    current_date + 14, 12, true, 'Dogs and cats welcome with a $300 pet deposit and $35/month pet rent. Max 2 pets.',
    array['Water', 'Trash'], array['Hardwood floors', 'Fenced yard', 'Washer/dryer hookups', 'Central air', 'Front porch', 'Off-street parking'], true
  ),
  (
    'north-elm-modern-townhome', 'Modern Townhome on North Elm',
    'Stylish 2-bedroom, 2.5-bath townhome with an open-concept main floor, stainless appliances, and a private patio. Each bedroom has its own bathroom. Attached one-car garage and in-unit laundry included.',
    'townhouse', 'available', '1820 N Elm St', 'Henderson', 'KY', '42420',
    37.8561, -87.5812, 125000, 125000, 2, 2.5, 1300,
    current_date, 12, true, 'Cats and small dogs under 40 lbs. $250 pet deposit.',
    array['Trash', 'Lawn care'], array['Attached garage', 'In-unit washer/dryer', 'Stainless appliances', 'Private patio', 'Central air'], true
  ),
  (
    'green-street-apartment-1br', 'Downtown Loft Apartment',
    'Bright 1-bedroom loft in a restored brick building on Green Street. Exposed brick, 12-foot ceilings, and oversized windows. Steps from the riverfront, W.C. Handy Blues festival grounds, and local coffee shops.',
    'apartment', 'available', '215 Second St, Unit 3B', 'Henderson', 'KY', '42420',
    37.8378, -87.5889, 85000, 85000, 1, 1, 780,
    current_date + 30, 12, false, 'No pets, please.',
    array['Water', 'Sewer', 'Trash', 'Internet'], array['Exposed brick', 'High ceilings', 'Dishwasher', 'Walk to downtown', 'Secure entry'], true
  ),
  (
    'south-heights-family-4br', 'Spacious Family Home in South Heights',
    'Room to grow in this 4-bedroom, 2.5-bath home on a quiet cul-de-sac near South Heights Elementary. Features a finished basement, two-car garage, and a large deck overlooking a wooded backyard.',
    'house', 'available', '905 Gabe Dr', 'Henderson', 'KY', '42420',
    37.8195, -87.5745, 189500, 189500, 4, 2.5, 2400,
    current_date + 21, 12, true, 'Pets considered on a case-by-case basis.',
    array[]::text[], array['Two-car garage', 'Finished basement', 'Large deck', 'Cul-de-sac', 'Near schools', 'Central air', 'Dishwasher'], false
  ),
  (
    'audubon-duplex-2br', 'Updated Duplex near Audubon Park',
    'Freshly updated 2-bedroom side-by-side duplex with new LVP flooring, modern lighting, and a spacious kitchen. Minutes from John James Audubon State Park and the Henderson bypass.',
    'duplex', 'pending', '2310 Madison St', 'Henderson', 'KY', '42420',
    37.8612, -87.5698, 95000, 95000, 2, 1, 1050,
    current_date + 7, 12, true, 'One pet allowed with $250 deposit.',
    array['Water', 'Trash'], array['New flooring', 'Washer/dryer hookups', 'Off-street parking', 'Storage shed'], false
  ),
  (
    'eastgate-condo-2br', 'Eastgate Garden Condo',
    'Low-maintenance 2-bedroom ground-floor condo with a private garden patio. Community pool and fitness room. Lawn care and exterior maintenance handled for you.',
    'condo', 'available', '1450 Barret Blvd, Unit 104', 'Henderson', 'KY', '42420',
    37.8279, -87.5621, 110000, 110000, 2, 2, 1100,
    current_date + 10, 12, false, 'No pets, please.',
    array['Water', 'Trash', 'Lawn care'], array['Community pool', 'Fitness room', 'Ground floor', 'Private patio', 'Walk-in closet', 'Dishwasher'], false
  )
  returning id, slug
)
insert into public.listing_photos (listing_id, url, sort_order)
select nl.id, p.url, p.sort_order
from new_listings nl
join (values
  ('riverfront-craftsman-3br', 'https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=1600&q=80', 0),
  ('riverfront-craftsman-3br', 'https://images.unsplash.com/photo-1556911220-bff31c812dba?w=1600&q=80', 1),
  ('riverfront-craftsman-3br', 'https://images.unsplash.com/photo-1505691938895-1758d7feb511?w=1600&q=80', 2),
  ('riverfront-craftsman-3br', 'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?w=1600&q=80', 3),
  ('north-elm-modern-townhome', 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1600&q=80', 0),
  ('north-elm-modern-townhome', 'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1600&q=80', 1),
  ('north-elm-modern-townhome', 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1600&q=80', 2),
  ('green-street-apartment-1br', 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1600&q=80', 0),
  ('green-street-apartment-1br', 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1600&q=80', 1),
  ('green-street-apartment-1br', 'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=1600&q=80', 2),
  ('south-heights-family-4br', 'https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=1600&q=80', 0),
  ('south-heights-family-4br', 'https://images.unsplash.com/photo-1540518614846-7eded433c457?w=1600&q=80', 1),
  ('audubon-duplex-2br', 'https://images.unsplash.com/photo-1580587771525-78b9dba3b914?w=1600&q=80', 0),
  ('audubon-duplex-2br', 'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1600&q=80', 1),
  ('eastgate-condo-2br', 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1600&q=80', 0),
  ('eastgate-condo-2br', 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1600&q=80', 1)
) as p(slug, url, sort_order) on p.slug = nl.slug;
