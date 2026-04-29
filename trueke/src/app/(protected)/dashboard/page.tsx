import { getServerSession } from 'next-auth'
import { Dashboard } from '@/components/sections/dashboard/dashboard'
import { Admin } from '@/components/admin/admin'
import { authOptions } from '@/utils/auth'
import { getAdminUsers, getReports } from '@/app/actions/admin'

const page = async () => {
  const session = await getServerSession(authOptions)

  if (session?.user?.is_admin) {
    const [usersResult, reportsResult] = await Promise.all([getAdminUsers(), getReports()])

    return (
      <Admin
        initialUsers={usersResult.data}
        initialUsersError={usersResult.error ?? null}
        initialReports={reportsResult.data}
        initialReportsError={reportsResult.error ?? null}
      />
    )
  }

  return (
    <Dashboard />
  )
}

export default page