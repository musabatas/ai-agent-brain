'use client';

import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ColumnDef,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  PaginationState,
  RowSelectionState,
  SortingState,
  useReactTable,
} from '@tanstack/react-table';
import { Ellipsis, Plus, Search, X } from 'lucide-react';
import { apiFetch } from '@/lib/api';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardFooter,
  CardHeader,
  CardTable,
  CardToolbar,
} from '@/components/ui/card';
import {
  DataGrid,
  DataGridApiFetchParams,
  DataGridApiResponse,
} from '@/components/ui/data-grid';
import { DataGridColumnHeader } from '@/components/ui/data-grid-column-header';
import { DataGridPagination } from '@/components/ui/data-grid-pagination';
import {
  DataGridTable,
  DataGridTableRowSelect,
  DataGridTableRowSelectAll,
} from '@/components/ui/data-grid-table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { UserPermission, UserRole } from '@/app/models/user';
import { useRoleSelectQuery } from '../../roles/hooks/use-role-select-query';
import PermissionDeleteDialog from './permission-delete-dialog';
import PermissionEditDialog from './permission-edit-dialog';
import PermissionGroupDeleteDialog from './permission-group-delete-dialog';

const PermissionList = () => {
  // List state management
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });
  const [sorting, setSorting] = useState<SortingState>([
    { id: 'createdAt', desc: true },
  ]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  // Form state management
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [groupDeleteDialogOpen, setGroupDeleteDialogOpen] = useState(false);
  const [editPermission, setEditPermission] = useState<UserPermission | null>(
    null,
  );
  const [deletePermission, setDeletePermission] =
    useState<UserPermission | null>(null);
  const [deletePermissionIds, setDeletePermissionIds] = useState<string[]>([]);
  const [selectedRole, setSelectedRole] = useState<string | null>(null);

  // Query state management
  const [searchQuery, setSearchQuery] = useState('');

  // Role select query
  const { data: roleList } = useRoleSelectQuery();

  // Fetch permissions from the server API
  const fetchPermissions = async ({
    pageIndex,
    pageSize,
    sorting,
    searchQuery,
  }: DataGridApiFetchParams): Promise<DataGridApiResponse<UserPermission>> => {
    const sortField = sorting?.[0]?.id || 'createdAt';
    const sortDirection = sorting?.[0]?.desc ? 'desc' : 'asc';

    const params = new URLSearchParams({
      page: String(pageIndex + 1),
      limit: String(pageSize),
      ...(sortField ? { sort: sortField, dir: sortDirection } : {}),
      ...(searchQuery ? { query: searchQuery } : {}),
      ...(selectedRole && selectedRole !== 'all'
        ? { roleId: selectedRole }
        : {}),
    });

    const response = await apiFetch(
      `/api/user-management/permissions?${params.toString()}`,
    );

    if (!response.ok) {
      throw new Error(
        'Oops! Something didn’t go as planned. Please try again in a moment',
      );
    }

    return response.json();
  };

  // Permissions query
  const { data, isLoading } = useQuery({
    queryKey: [
      'user-permissions',
      pagination,
      sorting,
      searchQuery,
      selectedRole,
    ],
    queryFn: () =>
      fetchPermissions({
        pageIndex: pagination.pageIndex,
        pageSize: pagination.pageSize,
        sorting,
        filters: [
          ...(selectedRole ? [{ id: 'role', value: selectedRole }] : []),
        ],
        searchQuery,
      }),
    staleTime: Infinity,
    gcTime: 1000 * 60 * 60, // 60 minutes
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    retry: 1,
  });

  // Handle row selection
  const handleRoleSelection = (roleId: string) => {
    setSelectedRole(roleId);
    setPagination({ ...pagination, pageIndex: 0 }); // Reset to first page when filtering
  };

  useEffect(() => {
    const selectedRowIds = Object.keys(rowSelection);
    if (selectedRowIds.length > 0) {
      setDeletePermissionIds(selectedRowIds);
    } else {
      setDeletePermissionIds([]);
    }
  }, [rowSelection]);

  // Column definitions
  const columns = useMemo<ColumnDef<UserPermission>[]>(
    () => [
      {
        id: 'id',
        accessorKey: 'id',
        header: () => <DataGridTableRowSelectAll />,
        cell: ({ row }) => <DataGridTableRowSelect row={row} />,
        size: 27,
        enableSorting: false,
        meta: {
          skeleton: <Skeleton className="size-5" />,
        },
        enableResizing: false,
      },
      {
        id: 'name',
        accessorKey: 'name',
        header: ({ column }) => (
          <DataGridColumnHeader title="Permission" column={column} />
        ),
        cell: (info) => info.getValue(),
        size: 150,
        enableSorting: true,
        enableHiding: false,
        meta: {
          headerTitle: 'Permission',
          skeleton: <Skeleton className="w-28 h-8" />,
        },
      },
      {
        id: 'slug',
        accessorKey: 'slug',
        header: ({ column }) => (
          <DataGridColumnHeader title="Slug" column={column} />
        ),
        cell: (info) => {
          const value = info.getValue() as string;

          return <Badge variant="secondary">{value}</Badge>;
        },
        size: 150,
        enableSorting: true,
        enableHiding: false,
        meta: {
          headerTitle: 'min-w-[200px]',
          skeleton: <Skeleton className="w-14 h-8" />,
        },
      },
      {
        id: 'description',
        accessorKey: 'description',
        header: ({ column }) => (
          <DataGridColumnHeader title="Description" column={column} />
        ),
        cell: (info) => {
          const value = info.getValue() as string;

          return <div className="truncate">{value}</div>;
        },
        size: 300,
        enableSorting: false,
        enableHiding: false,
        meta: {
          headerTitle: 'Description',
          skeleton: <Skeleton className="w-28 h-8" />,
        },
      },
      {
        id: 'createdAt',
        accessorKey: 'createdAt',
        header: ({ column }) => (
          <DataGridColumnHeader title="Created At" column={column} />
        ),
        cell: (info) => {
          const value = info.getValue() as string;
          return new Date(value).toLocaleString();
        },
        enableSorting: true,
        enableHiding: false,
        meta: {
          headerTitle: 'Created At',
          skeleton: <Skeleton className="w-20 h-8" />,
        },
      },
      {
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button mode="icon" variant="ghost">
                <Ellipsis />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="bottom" align="start">
              <DropdownMenuItem
                onClick={() => {
                  setEditPermission(row.original);
                  setEditDialogOpen(true);
                }}
              >
                Edit permission
              </DropdownMenuItem>
              <DropdownMenuItem
                variant="destructive"
                onClick={() => {
                  setDeletePermission(row.original);
                  setDeleteDialogOpen(true);
                }}
              >
                Delete permission
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ),
        size: 90,
        enableSorting: false,
        enableHiding: false,
        enableResizing: false,
        meta: {
          skeleton: <Skeleton className="size-5" />,
        },
      },
    ],
    [],
  );

  const [columnOrder, setColumnOrder] = useState<string[]>(
    columns.map((column) => column.id as string),
  );

  const table = useReactTable({
    columns,
    data: data?.data || [],
    pageCount: Math.ceil((data?.pagination.total || 0) / pagination.pageSize),
    getRowId: (row: UserPermission) => row.id,
    state: {
      pagination,
      sorting,
      columnOrder,
      rowSelection,
    },
    enableRowSelection: true,
    onRowSelectionChange: setRowSelection,
    onColumnOrderChange: setColumnOrder,
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination: true,
    manualSorting: true,
    manualFiltering: true,
  });

  const DataGridToolbar = () => {
    const [inputValue, setInputValue] = useState(searchQuery);

    const handleSearch = () => {
      setSearchQuery(inputValue);
      setPagination({ ...pagination, pageIndex: 0 });
    };

    return (
      <CardHeader className="flex-col flex-wrap sm:flex-row items-end items-stretch sm:items-center py-5">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          <div className="relative">
            <Search className="size-4 text-muted-foreground absolute start-3 top-1/2 -translate-y-1/2" />
            <Input
              placeholder="Search permissions"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              disabled={isLoading && true}
              className="ps-9 w-full sm:w-64"
            />
            {searchQuery.length > 0 && (
              <Button
                mode="icon"
                variant="dim"
                className="absolute end-1.5 top-1/2 -translate-y-1/2 h-6 w-6"
                onClick={() => setSearchQuery('')}
              >
                <X />
              </Button>
            )}
          </div>
          <Select
            disabled={isLoading && true}
            onValueChange={handleRoleSelection}
            value={selectedRole || 'all'}
            defaultValue="all"
          >
            <SelectTrigger className="w-full sm:w-36">
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All roles</SelectItem>
              {roleList?.map((role: UserRole) => (
                <SelectItem key={role.id} value={role.id}>
                  {role.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <CardToolbar>
          {deletePermissionIds.length > 0 && (
            <Button
              variant="destructive"
              onClick={() => {
                setGroupDeleteDialogOpen(true);
              }}
            >
              Delete {deletePermissionIds.length} permissions
            </Button>
          )}
          <Button
            disabled={isLoading && true}
            onClick={() => {
              setEditPermission(null);
              setEditDialogOpen(true);
            }}
          >
            <Plus />
            Add Permission
          </Button>
        </CardToolbar>
      </CardHeader>
    );
  };

  return (
    <>
      <DataGrid
        table={table}
        recordCount={data?.pagination.total || 0}
        isLoading={isLoading}
        tableLayout={{
          columnsResizable: true,
          columnsPinnable: true,
          columnsMovable: true,
          columnsVisibility: true,
        }}
        tableClassNames={{
          edgeCell: 'px-5',
        }}
      >
        <Card>
          <DataGridToolbar />
          <CardTable>
            <ScrollArea>
              <DataGridTable />
              <ScrollBar orientation="horizontal" />
            </ScrollArea>
          </CardTable>
          <CardFooter>
            <DataGridPagination />
          </CardFooter>
        </Card>
      </DataGrid>

      <PermissionEditDialog
        open={editDialogOpen}
        closeDialog={() => setEditDialogOpen(false)}
        permission={editPermission}
      />

      {deletePermission && (
        <PermissionDeleteDialog
          open={deleteDialogOpen}
          closeDialog={() => setDeleteDialogOpen(false)}
          permission={deletePermission}
        />
      )}

      {deletePermissionIds && (
        <PermissionGroupDeleteDialog
          open={groupDeleteDialogOpen}
          closeDialog={() => {
            setGroupDeleteDialogOpen(false);
            setRowSelection({});
          }}
          permissionIds={deletePermissionIds}
        />
      )}
    </>
  );
};

export default PermissionList;
