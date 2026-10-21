import { useEffect, useState } from 'react'
import { Alert, Card, Chip, Skeleton, Table, TableBody, TableCell, TableContainer, TableHead, TablePagination, TableRow, Typography } from '@mui/material'
import HistoryIcon from '@mui/icons-material/History'
import adminApi from './adminApi.js'
import { errorMessage } from '../lib/api.js'
import EmptyState from '../components/EmptyState.jsx'
import { PageHeader, fmtDate } from './bits.jsx'

const ACTIONS = {
  SHOP_APPROVED: ['Approved shop', 'success'], SHOP_REJECTED: ['Rejected shop', 'error'], SHOP_SUSPENDED: ['Suspended shop', 'error'],
  SHOP_REINSTATED: ['Reinstated shop', 'success'], ADMIN_CREATED: ['Added admin', 'info'], ADMIN_DEACTIVATED: ['Deactivated admin', 'warning'],
  ADMIN_REACTIVATED: ['Reactivated admin', 'info'], PASSWORD_CHANGED: ['Changed password', 'default'],
}

export default function AdminAudit() {
  const [page, setPage] = useState(0)
  const [data, setData] = useState(null)
  const [error, setError] = useState('')

  useEffect(() => {
    adminApi.get('/audit', { params: { page, size: 30 } }).then(({ data }) => { setData(data); setError('') }).catch((e) => setError(errorMessage(e)))
  }, [page])

  return (
    <>
      <PageHeader title="Audit log" subtitle="Every approval, rejection, suspension and admin change, newest first." />
      {error && <Alert severity="error">{error}</Alert>}
      {!data && !error && <Skeleton variant="rounded" height={300} sx={{ borderRadius: '16px' }} />}
      {data && data.total === 0 && <Card><EmptyState icon={<HistoryIcon />} title="Nothing yet">Admin actions will be listed here.</EmptyState></Card>}
      {data && data.total > 0 && (
        <Card>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow sx={{ '& th': { fontWeight: 700, color: 'text.secondary', bgcolor: 'action.hover' } }}>
                  <TableCell>When</TableCell><TableCell>Who</TableCell><TableCell>Action</TableCell><TableCell>On</TableCell><TableCell>Details</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.items.map((e) => {
                  const [label, color] = ACTIONS[e.action] || [e.action, 'default']
                  return (
                    <TableRow key={e.id}>
                      <TableCell sx={{ whiteSpace: 'nowrap' }}>{fmtDate(e.createdAt)}</TableCell>
                      <TableCell>{e.adminEmail}</TableCell>
                      <TableCell><Chip size="small" variant="outlined" color={color} label={label} /></TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>{e.targetLabel}</TableCell>
                      <TableCell><Typography variant="body2" color="text.secondary">{e.details}</Typography></TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </TableContainer>
          <TablePagination component="div" count={data.total} page={page} rowsPerPage={30} rowsPerPageOptions={[30]} onPageChange={(_e, p) => setPage(p)} />
        </Card>
      )}
    </>
  )
}
