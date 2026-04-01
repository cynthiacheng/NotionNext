/**
 * GET    /api/usecases/usecases           → list use cases (own for partner, all for admin)
 * DELETE /api/usecases/usecases?id=<n>   → delete a use case
 */

import { getAllUseCases, getUseCasesByAccountId, deleteUseCase } from '../../../lib/usecases/database'
import { requireAuth } from '../../../lib/usecases/auth'

export default function handler(req, res) {
  const user = requireAuth(req, res)
  if (!user) return

  if (req.method === 'GET') {
    const list = user.role === 'admin'
      ? getAllUseCases()
      : getUseCasesByAccountId(user.id)
    return res.status(200).json({ useCases: list, total: list.length })
  }

  if (req.method === 'DELETE') {
    const id = Number(req.query.id)
    if (!id) return res.status(400).json({ error: 'id query param is required' })
    try {
      deleteUseCase(id, user.id, user.role)
      return res.status(200).json({ message: 'Use case deleted' })
    } catch (err) {
      const status = err.message === 'Forbidden' ? 403 : 404
      return res.status(status).json({ error: err.message })
    }
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
