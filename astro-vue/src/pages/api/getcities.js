import { getCities } from '../../lib/site-data.js';

export async function GET({ request }) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') || '';

  try {
    const cities = await getCities();

    const results = cities
      .filter((cityObj) => cityObj.city.toLowerCase().startsWith(q.toLowerCase()))
      .sort((a, b) => {
        if (a.city.toLowerCase() === b.city.toLowerCase()) {
          return a.state.localeCompare(b.state);
        }

        return a.city.localeCompare(b.city);
      })
      .slice(0, 25)
      .map((item) => ({
        type: 'city',
        city: item.city,
        state: item.state,
        lat: item.lat,
        lng: item.lng,
        label: `${item.city}, ${item.state}`,
      }));

    return Response.json(results);
  } catch (error) {
    return Response.json({ message: 'Internal server error' }, { status: 500 });
  }
}
