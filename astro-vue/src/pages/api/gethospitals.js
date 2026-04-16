import { queryHospitalSuggestions } from '../../lib/hospital-search.js';

export async function GET({ request }) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q') || '';

  try {
    const results = await queryHospitalSuggestions(q, 50);
    return Response.json(results);
  } catch (error) {
    return Response.json({ message: 'Internal server error' }, { status: 500 });
  }
}
