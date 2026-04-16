import { getLocations, getLocationById } from '../../lib/site-data.js';
import { searchLocations } from '../../lib/search.js';

const jsonHeaders = {
  'Content-Type': 'application/json; charset=utf-8',
};

const normalize = (value = '') => String(value || '').trim();

export async function GET({ url }) {
  try {
    const params = url.searchParams;
    const specialty = normalize(params.get('specialty'));
    const hvKey = [...params.keys()].find((key) => key.startsWith('hv_'));
    const lmKey = [...params.keys()].find((key) => key.startsWith('lm_'));

    const rows = await searchLocations({
      by: normalize(params.get('by')) || 'city',
      hospital: normalize(params.get('hospital')),
      state: normalize(params.get('state')),
      city: normalize(params.get('city')),
      zip: normalize(params.get('zip')),
      specialty,
      lat: params.get('lat'),
      lng: params.get('lng'),
      radius: params.get('radius'),
      excellence: params.get('excellence') === '1',
      hvOn: !!hvKey,
      lmOn: !!lmKey,
    });

    return new Response(JSON.stringify(rows), {
      status: 200,
      headers: jsonHeaders,
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        message: 'Internal server error',
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: jsonHeaders,
      },
    );
  }
}

export async function POST({ request }) {
  try {
    const body = await request.json();
    const ids = Array.isArray(body?.ids) ? body.ids : [];
    const objects = Array.isArray(body?.objects) ? body.objects : [];

    const resultById = [];

    for (const id of ids) {
      const match = await getLocationById(id);

      if (match) {
        resultById.push(match);
      }
    }

    const allLocations = await getLocations();
    const resultByObject = objects.map((item) => {
      const title = normalize(item?.title);
      return allLocations.find((location) => normalize(location.title) === title) ?? item;
    });

    return new Response(JSON.stringify([...resultById, ...resultByObject]), {
      status: 200,
      headers: jsonHeaders,
    });
  } catch {
    return new Response(
      JSON.stringify({
        message: 'Invalid JSON or internal error',
      }),
      {
        status: 400,
        headers: jsonHeaders,
      },
    );
  }
}
