import type { VercelRequest, VercelResponse } from '@vercel/node';
import bcrypt from 'bcryptjs';
import { getPool } from '../../lib/db';
import { signToken } from '../../lib/auth';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const { email, password } = req.body ?? {};
  if (!email || !password) {
    return res.status(400).json({ message: 'Email e senha são obrigatórios' });
  }

  const pool = getPool();
  const result = await pool.query(
    'SELECT id, email, name, role, password FROM users WHERE email = $1',
    [email]
  );

  const user = result.rows[0];
  if (!user) {
    return res.status(401).json({ message: 'Credenciais inválidas' });
  }

  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    return res.status(401).json({ message: 'Credenciais inválidas' });
  }

  const token = signToken({ sub: user.id, email: user.email, role: user.role });

  return res.status(200).json({
    data: {
      accessToken: token,
      user: { id: user.id, email: user.email, name: user.name, role: user.role },
    },
  });
}
