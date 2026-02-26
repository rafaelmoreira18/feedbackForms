import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getPool } from '../../lib/db';
import { requireAuth } from '../../lib/auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ message: 'Method not allowed' });

  const user = requireAuth(req, res);
  if (!user) return;

  const pool = getPool();
  const { startDate, endDate } = req.query;

  let query = 'SELECT * FROM form2_responses WHERE 1=1';
  const params: unknown[] = [];
  let idx = 1;

  if (startDate) { query += ` AND "createdAt" >= $${idx++}`; params.push(startDate); }
  if (endDate)   { query += ` AND "createdAt" <= $${idx++}`; params.push(`${endDate}T23:59:59.999Z`); }

  const result = await pool.query(query, params);
  const forms = result.rows;

  const fields = [
    'hospitalOverallInfrastructure','commonAreasAdequacy','equipmentSafety','equipmentCondition',
    'bedComfort','accommodationNeeds','mealQuality','mealTimeliness','nutritionTeamCare',
    'hospitalSignage','teamCommunicationClarity','medicalTeamRelationship','diagnosisExplanation',
    'feltHeardByMedicalTeam','nursingTeamCare','nursingTeamAvailability','feltSafeWithCare',
    'technologyAccess','connectivitySatisfaction','laundryCleanlinessOrganization','laundryChangeFrequency',
  ];

  const now = new Date();
  const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
  const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const lastMonthEnd   = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);

  let totalSat = 0;
  let thisMonth = 0;
  let lastMonth = 0;

  for (const f of forms) {
    const infra = f.infrastructure;
    const avg = fields.reduce((sum, k) => sum + (Number(infra[k]) || 0), 0) / fields.length;
    totalSat += avg;

    const d = new Date(f.createdAt);
    if (d >= thisMonthStart) thisMonth++;
    if (d >= lastMonthStart && d <= lastMonthEnd) lastMonth++;
  }

  const total = forms.length;

  return res.status(200).json({
    data: {
      totalResponses: total,
      averageSatisfaction: total > 0 ? Math.round((totalSat / total) * 10) / 10 : 0,
      responsesThisMonth: thisMonth,
      responsesLastMonth: lastMonth,
    },
  });
}
