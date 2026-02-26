import type { VercelRequest, VercelResponse } from '@vercel/node';
import { getPool } from '../../lib/db';
import { requireAuth } from '../../lib/auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).json({ message: 'Method not allowed' });

  const user = requireAuth(req, res);
  if (!user) return;

  const { id } = req.query;
  const pool = getPool();

  const result = await pool.query('SELECT * FROM form2_responses WHERE id = $1', [id]);
  if (result.rows.length === 0) {
    return res.status(404).json({ message: 'Form not found' });
  }

  return res.status(200).json({ data: result.rows[0] });
}
