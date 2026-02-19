"use client"
import { useEffect, useState, useCallback, useRef } from "react"

import {
  flexRender,
  getCoreRowModel,
  useReactTable,
  getPaginationRowModel,
  SortingState,
  getSortedRowModel,
  ColumnDef,
  ColumnFiltersState,
  getFilteredRowModel,
  VisibilityState,
  CellContext,
} from "@tanstack/react-table"

import { MoreHorizontal } from "lucide-react"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"

import { Checkbox } from "@/components/ui/checkbox"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

import { Map } from "@/lib/types"
import { Info } from "lucide-react"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { motion, AnimatePresence } from "framer-motion"
import { itemVariants } from "@/lib/anims"
import { Input } from "@/components/ui/input"

interface RowAction {
  label: string;
  onClick: (row: any) => void;
}

export interface ColumnDefinition<TData> {
  accessorKey: keyof TData;
  header: string;
  cell?: (info: { getValue: () => any }) => React.ReactNode;
}

interface DataTableProps<TData> {
  data: TData[]
  columns?: ColumnDefinition<TData>[]
  enableSelection?: boolean
  setSelection?: (selectedData: TData[]) => void
  enablePagination?: boolean
  pageSize?: number
  enableRowActions?: boolean
  rowActions?: RowAction[]
  enableFiltering?: boolean
  infiniteScroll?: boolean
}

export const DataTable = <TData,>({
  data,
  columns: providedColumns,
  setSelection,
  enableSelection = false,
  enablePagination = false,
  pageSize = 10,
  enableRowActions = false,
  rowActions,
  enableFiltering = false,
  infiniteScroll = false,
}: DataTableProps<TData>) => {
  const observerTarget = useRef<HTMLDivElement>(null)
  const [virtualPageSize, setVirtualPageSize] = useState(pageSize)

  const [rowSelection, setRowSelection] = useState({})
  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState("")
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: infiniteScroll ? data.length : pageSize,
  })
  const [isPageTransition, setIsPageTransition] = useState(false)

  const buildColumns = (data: Map, providedColumns?: ColumnDefinition<TData>[], rowActions?: RowAction[]) => {
    const columns: ColumnDef<Map>[] = []

    if (!data || !Array.isArray(data) || data.length === 0) {
      return columns
    }

    if (enableSelection) {
      columns.push({
        id: "select",
        header: ({ table }) => (
          <Checkbox
            checked={table.getIsAllPageRowsSelected()}
            onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
            aria-label="Select all"
          />
        ),
        cell: ({ row }) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        ),
        enableSorting: false,
        enableHiding: false,
      })
    }

    const createObjectCell = (getValue: () => any, row: any, column: any) => {
      
      const value = getValue()

      if (typeof value === 'boolean') {
        return (
          <Checkbox checked={value} />
        )
      }

      if (typeof value === 'object' && value !== null) {
        return (
          <TooltipProvider delayDuration={10}>
            <Tooltip>
              <TooltipTrigger asChild className="w-full flex justify-center">
                <Button size="icon" className="h-6 w-6 p-0 bg-transparent hover:bg-transparent">
                  <Info className="h-4 w-4 text-primary" />
                  <span className="sr-only">View object details</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <pre className="max-w-xs overflow-auto text-xs">
                  {JSON.stringify(value, null, 2)}
                </pre>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )
      }

      return value
    }

    if (providedColumns) {
      columns.push(...providedColumns.map(col => ({
        accessorKey: col.accessorKey,
        header: col.header,
        cell: col.cell || ((context: CellContext<Map, any>) => createObjectCell(context.getValue, context.row, context.column)),
      })))
    } else if (data.length > 0 && typeof data[0] === 'object') {
      Object.keys(data[0]).forEach((column) => {
        columns.push({
          accessorKey: column,
          header: column,
          cell: (context: CellContext<Map, any>) => createObjectCell(context.getValue, context.row, context.column),
        })
      })
    }

    if (enableRowActions && rowActions) {
      columns.push({
        id: "actions",
        cell: ({ row }) => {
          return (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-8 w-8 p-0">
                  <span className="sr-only">Open menu</span>
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                {rowActions.map((action, index) => (
                  <DropdownMenuItem
                    key={index}
                    onClick={() => action.onClick(row.original)}
                  >
                    {action.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )
        },
      })
    }

    return columns
  }

  const columns = buildColumns(data as Map, providedColumns, rowActions)

  const table = useReactTable({
    data,
    columns: columns as ColumnDef<TData, any>[],
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: infiniteScroll ? undefined : getPaginationRowModel(),
    onSortingChange: setSorting,
    getSortedRowModel: getSortedRowModel(),
    onRowSelectionChange: setRowSelection,
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onPaginationChange: (updater) => {
      setIsPageTransition(true)
      setPagination(updater)
    },
    state: {
      sorting,
      rowSelection,
      globalFilter,
      columnVisibility,
      pagination: infiniteScroll ? undefined : pagination,
    },
    initialState: {
      pagination: {
        pageSize: infiniteScroll ? data.length : pageSize,
      },
    },
    globalFilterFn: (row, columnId, filterValue) => {
      const value = row.getValue(columnId)
      if (value === null || value === undefined) return false
      return String(value)
        .toLowerCase()
        .includes(String(filterValue).toLowerCase())
    },
  })

  useEffect(() => {
    if (!infiniteScroll) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVirtualPageSize(prev => Math.min(prev + pageSize, data.length))
        }
      },
      { threshold: 0.1 }
    )

    if (observerTarget.current) {
      observer.observe(observerTarget.current)
    }

    return () => observer.disconnect()
  }, [infiniteScroll, pageSize, data.length])

  useEffect(() => {
    if (enableSelection && setSelection) {
      const selectedRows = table.getFilteredSelectedRowModel().rows.map((row) => row.original)
      setSelection(selectedRows as TData[])
    }
  }, [rowSelection, enableSelection, setSelection, table])

  useEffect(() => {
    if (isPageTransition) {
      setIsPageTransition(false)
    }
  }, [pagination.pageIndex])

  const getVisibleRows = useCallback(() => {
    if (!infiniteScroll) return table.getRowModel().rows

    return table
      .getRowModel()
      .rows
      .slice(0, virtualPageSize)
  }, [infiniteScroll, table, virtualPageSize])

  if (!data || data.length === 0) {
    return (
      <div className="w-full rounded-md text-foreground relative border p-5">
        <div className="flex justify-center items-center h-24">
          No data available
        </div>
      </div>
    )
  }

  return (
    <div className="w-full rounded-md text-foreground relative border p-5">
        <div className="flex justify-between items-center gap-4 py-4">
          {enableFiltering && (
            <Input
              placeholder="Search all columns..."
              value={globalFilter}
              onChange={(event) => setGlobalFilter(event.target.value)}
              className="max-w-sm"
            />
          )}
        </div>

      <div className={infiniteScroll ? "max-h-[150px] overflow-y-auto" : ""}>
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id} className="whitespace-nowrap">
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            <AnimatePresence mode="sync">
              {getVisibleRows()?.length ? (
                getVisibleRows().map((row, index) => (
                  <motion.tr
                    key={row.id}
                    initial={isPageTransition ? "visible" : "hidden"}
                    animate="visible"
                    exit="hidden"
                    custom={index}
                    whileHover="hover"
                    className="hover:bg-muted cursor-pointer whitespace-nowrap"
                    data-state={row.getIsSelected() && "selected"}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="select-all whitespace-normal max-w-[50ch]">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </TableCell>
                    ))}
                  </motion.tr>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={columns.length} className="h-24 text-center">
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </AnimatePresence>
          </TableBody>
        </Table>
        {infiniteScroll && virtualPageSize < data.length && (
          <div 
            ref={observerTarget} 
            className="h-10 w-full flex items-center justify-center"
          >
            <div className="text-sm text-muted-foreground">Loading more...</div>
          </div>
        )}
      </div>
      {enablePagination && !infiniteScroll && (
        <div className="flex items-center justify-between space-x-2 py-4">
          <div className="flex gap-2">
            <motion.div whileHover="hover" whileTap="tap">
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                Previous
              </Button>
            </motion.div>
            <motion.div whileHover="hover" whileTap="tap">
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                Next
              </Button>
            </motion.div>
          </div>
        </div>
      )}
    </div>
  )
}
