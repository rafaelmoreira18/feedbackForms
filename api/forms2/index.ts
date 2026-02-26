import type { VercelRequest, VercelResponse } from '@vercel/node';
import { randomUUID } from 'crypto';
import { getPool } from '../../lib/db';
import { requireAuth } from '../../lib/auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const pool = getPool();

  // POST /api/forms2 — public
  if (req.method === 'POST') {
    const {
      patientName, patientCpf, patientAge, patientGender,
      admissionDate, dischargeDate, infrastructure, patientSafety, comments,
    } = req.body ?? {};

    const id = randomUUID();
    const createdAt = new Date().toISOString();

    await pool.query(
      `INSERT INTO form2_responses
        (id, "patientName", "patientCpf", "patientAge", "patientGender",
         "admissionDate", "dischargeDate", infrastructure, "patientSafety", comments, "createdAt")
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)`,
      [
        id, patientName, patientCpf, patientAge, patientGender,
        admissionDate, dischargeDate,
        JSON.stringify(infrastructure), JSON.stringify(patientSafety),
        comments ?? '', createdAt,
      ]
    );

    const inserted = await pool.query('SELECT * FROM form2_responses WHERE id = $1', [id]);
    return res.status(201).json({ data: inserted.rows[0] });
  }

  // GET /api/forms2 — protected
  if (req.method === 'GET') {
    const user = requireAuth(req, res);
    if (!user) return;

    const { startDate, endDate, sortSatisfaction } = req.query;

    let query = 'SELECT * FROM form2_responses WHERE 1=1';
    const params: unknown[] = [];
    let idx = 1;

    if (startDate) { query += ` AND "createdAt" >= $${idx++}`; params.push(startDate); }
    if (endDate)   { query += ` AND "createdAt" <= $${idx++}`; params.push(`${endDate}T23:59:59.999Z`); }

    if (sortSatisfaction === 'asc' || sortSatisfaction === 'desc') {
      const fields = [
        'hospitalOverallInfrastructure','commonAreasAdequacy','equipmentSafety','equipmentCondition',
        'bedComfort','accommodationNeeds','mealQuality','mealTimeliness','nutritionTeamCare',
        'hospitalSignage','teamCommunicationClarity','medicalTeamRelationship','diagnosisExplanation',
        'feltHeardByMedicalTeam','nursingTeamCare','nursingTeamAvailability','feltSafeWithCare',
        'technologyAccess','connectivitySatisfaction','laundryCleanlinessOrganization','laundryChangeFrequency',
      ];
      const sum = fields.map(f => `(infrastructure->>'${f}')::numeric`).join(' + ');
      query += ` ORDER BY (${sum}) / 21 ${sortSatisfaction.toUpperCase()}`;
    } else {
      query += ' ORDER BY "createdAt" DESC';
    }

    const result = await pool.query(query, params);
    return res.status(200).json({ data: result.rows });
  }

  return res.status(405).json({ message: 'Method not allowed' });
}
