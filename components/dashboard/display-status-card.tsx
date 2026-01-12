import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'

export type DisplayStatusRow = {
  stationName: string
  openHref?: string | null
  isActive: boolean
  openOrders: number
  pendingOrders: number
  preparingOrders: number
  readyOrders: number
  urgentOrders: number
  oldestOrderMinutes: number | null
  lastActivityIso: string | null
}

function formatMinutes(value: number) {
  if (value < 60) return `${value}m`
  const hours = Math.floor(value / 60)
  const minutes = value % 60
  return minutes === 0 ? `${hours}h` : `${hours}h ${minutes}m`
}

export function DisplayStatusCard({
  rows,
  totalOpenOrders,
  totalUrgentOrders,
  totalReadyOrders,
}: {
  rows: DisplayStatusRow[]
  totalOpenOrders: number
  totalUrgentOrders: number
  totalReadyOrders: number
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle>Display Status</CardTitle>
          <CardDescription>
            {totalOpenOrders} open · {totalReadyOrders} ready · {totalUrgentOrders} urgent
          </CardDescription>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/dashboard/settings?tab=kds">Manage displays</Link>
        </Button>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <div className="text-sm text-muted-foreground">
            No displays found. Create Kitchen/Bar displays in Settings.
          </div>
        ) : (
          <div className="w-full overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="py-2 pr-4 font-medium">Station</th>
                  <th className="py-2 pr-4 font-medium">Status</th>
                  <th className="py-2 pr-4 font-medium">Open</th>
                  <th className="py-2 pr-4 font-medium">Pending</th>
                  <th className="py-2 pr-4 font-medium">Preparing</th>
                  <th className="py-2 pr-4 font-medium">Ready</th>
                  <th className="py-2 pr-4 font-medium">Urgent</th>
                  <th className="py-2 pr-4 font-medium">Oldest</th>
                  <th className="py-2 font-medium">Last Activity</th>
                  <th className="py-2 font-medium"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.stationName} className="border-b last:border-0">
                    <td className="py-3 pr-4 font-medium">{row.stationName}</td>
                    <td className="py-3 pr-4">
                      <Badge variant={row.isActive ? 'default' : 'outline'}>
                        {row.isActive ? 'Active' : 'Idle'}
                      </Badge>
                    </td>
                    <td className="py-3 pr-4 tabular-nums">{row.openOrders}</td>
                    <td className="py-3 pr-4 tabular-nums">{row.pendingOrders}</td>
                    <td className="py-3 pr-4 tabular-nums">{row.preparingOrders}</td>
                    <td className="py-3 pr-4 tabular-nums">{row.readyOrders}</td>
                    <td className="py-3 pr-4">
                      {row.urgentOrders > 0 ? (
                        <Badge variant="destructive" className="tabular-nums">
                          {row.urgentOrders}
                        </Badge>
                      ) : (
                        <span className="tabular-nums text-muted-foreground">0</span>
                      )}
                    </td>
                    <td className="py-3 pr-4">
                      {row.oldestOrderMinutes === null ? (
                        <span className="text-muted-foreground">—</span>
                      ) : (
                        <span className="tabular-nums">{formatMinutes(row.oldestOrderMinutes)}</span>
                      )}
                    </td>
                    <td className="py-3">
                      {row.lastActivityIso ? (
                        <span className="tabular-nums">
                          {new Date(row.lastActivityIso).toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="py-3 text-right">
                      {row.openHref ? (
                        <Button asChild variant="outline" size="sm">
                          <Link href={row.openHref}>Open</Link>
                        </Button>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
