import type { VercelRequest, VercelResponse } from '@vercel/node';
import { v4 as uuidv4 } from 'uuid';
import { getPool } from '../../lib/db';
import { requireAuth } from '../../lib/auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const pool = getPool();

  // POST /api/forms — public
  if (req.method === 'POST') {
    const {
      patientName, patientCpf, patientAge, patientGender,
      admissionDate, dischargeDate, evaluatedDepartment,
      satisfaction, experience, comments,
    } = req.body ?? {};

    const id = uuidv4();
    const createdAt = new Date().toISOString();

    await pool.query(
      `INSERT INTO form_responses
        (id, "patientName", "patientCpf", "patientAge", "patientGender",
         "admissionDate", "dischargeDate", "evaluatedDepartment",
         satisfaction, experience, comments, "createdAt")
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)`,
      [
        id, patientName, patientCpf, patientAge, patientGender,
        admissionDate, dischargeDate, evaluatedDepartment,
        JSON.stringify(satisfaction), JSON.stringify(experience),
        comments ?? '', createdAt,
      ]
    );

    const inserted = await pool.query('SELECT * FROM form_responses WHERE id = $1', [id]);
    return res.status(201).json({ data: inserted.rows[0] });
  }

  // GET /api/forms — protected
  if (req.method === 'GET') {
    const user = requireAuth(req, res);
    if (!user) return;

    const { startDate, endDate, evaluatedDepartment, sortSatisfaction } = req.query;

    let query = 'SELECT * FROM form_responses WHERE 1=1';
    const params: unknown[] = [];
    let idx = 1;

    if (startDate) {
      query += ` AND "createdAt" >= $${idx++}`;
      params.push(startDate);
    }
    if (endDate) {
      query += ` AND "createdAt" <= $${idx++}`;
      params.push(`${endDate}T23:59:59.999Z`);
    }
    if (evaluatedDepartment) {
      query += ` AND "evaluatedDepartment" = $${idx++}`;
      params.push(evaluatedDepartment);
    }
    if (sortSatisfaction === 'asc' || sortSatisfaction === 'desc') {
      query += ` ORDER BY (
        (satisfaction->>'overallCare')::numeric +
        (satisfaction->>'nursingCare')::numeric +
        (satisfaction->>'medicalCare')::numeric +
        (satisfaction->>'welcoming')::numeric +
        (satisfaction->>'cleanliness')::numeric +
        (satisfaction->>'comfort')::numeric +
        (satisfaction->>'responseTime')::numeric +
        (satisfaction->>'overallSatisfaction')::numeric
      ) / 8 ${sortSatisfaction.toUpperCase()}`;
    } else {
      query += ' ORDER BY "createdAt" DESC';
    }

    const result = await pool.query(query, params);
    return res.status(200).json({ data: result.rows });
  }

  return res.status(405).json({ message: 'Method not allowed' });
}
