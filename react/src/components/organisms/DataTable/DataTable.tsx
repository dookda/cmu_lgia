import { useRef, useEffect } from 'react'
import DataTableLib from 'datatables.net-react'
import DT from 'datatables.net-bs5'
import type { Config } from 'datatables.net-bs5'
import 'datatables.net-bs5/css/dataTables.bootstrap5.min.css'
import { Spinner } from '../../atoms/Spinner/Spinner'

// Register the Bootstrap 5 bindings once
DataTableLib.use(DT)

export interface DTColumn {
  title: string
  data?: string | null
  // DataTables render receives (data, type, row, meta)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  render?: (data: unknown, type: string, row: unknown, meta?: any) => string
  orderable?: boolean
  searchable?: boolean
  width?: string
  className?: string
  /**
   * Called after the cell <td> is created.
   * Use this to inject React content via createRoot when you need
   * interactive React components (buttons, links) inside cells.
   */
  createdCell?: (cell: HTMLElement, cellData: unknown, rowData: unknown) => void
}

interface DataTableProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data: any[]
  columns: DTColumn[]
  loading?: boolean
  pageLength?: number
}

const DT_LANG = {
  search: 'ค้นหา:',
  lengthMenu: 'แสดง _MENU_ รายการ',
  info: 'แสดง _START_ ถึง _END_ จาก _TOTAL_ รายการ',
  infoEmpty: 'ไม่พบข้อมูล',
  infoFiltered: '(กรองจากทั้งหมด _MAX_ รายการ)',
  zeroRecords: 'ไม่พบข้อมูลที่ค้นหา',
  paginate: { first: '«', previous: '‹', next: '›', last: '»' },
  emptyTable: 'ไม่มีข้อมูลในตาราง',
}

const DT_DOM =
  "<'row mb-3'<'col-sm-6'l><'col-sm-6 d-flex justify-content-end'f>>" +
  "<'row'<'col-12 table-responsive'tr>>" +
  "<'row mt-3'<'col-sm-5'i><'col-sm-7 d-flex justify-content-end'p>>"

export function AppDataTable({ data, columns, loading = false, pageLength = 10 }: DataTableProps) {
  const tableRef = useRef<InstanceType<typeof DataTableLib> | null>(null)

  // Re-draw when data changes
  useEffect(() => {
    if (tableRef.current) {
      // datatables.net-react handles data refresh internally via prop change
    }
  }, [data])

  if (loading) {
    return (
      <div className="d-flex justify-content-center py-5">
        <Spinner />
      </div>
    )
  }

  const options: Config = {
    pageLength,
    lengthMenu: [10, 25, 50, 100],
    language: DT_LANG,
    responsive: true,
    autoWidth: false,
    dom: DT_DOM,
    columns: columns as Config['columns'],
  }

  return (
    <DataTableLib
      ref={tableRef}
      data={data}
      options={options}
      className="table table-striped table-hover w-100"
    >
      <thead>
        <tr>
          {columns.map((col, i) => (
            <th key={i} className={col.className}>{col.title}</th>
          ))}
        </tr>
      </thead>
    </DataTableLib>
  )
}
