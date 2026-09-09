# 📘 Guía Maestra: Data Table Avanzada (tablecn)

Esta guía detalla cómo implementar y personalizar la tabla de datos avanzada en este proyecto. Está diseñada sobre `@tanstack/react-table` y los componentes de `shadcn/ui`, proporcionando una experiencia premium con filtrado facetado, acciones masivas y estados sincronizados.

---

## 🏗️ 1. Estructura de la Tabla

La tabla se divide en componentes modulares que puedes encontrar en `src/components/data-table/`:

- **`DataTable`**: El contenedor principal que recibe el objeto `table`.
- **`DataTableToolbar`**: Barra superior para búsquedas, filtros facetados y visibilidad de columnas.
- **`DataTablePagination`**: Controles inferiores para navegación entre páginas y tamaño de página.
- **`DataTableColumnHeader`**: Cabeceras con soporte para ordenación (Asc/Desc) y ocultación.
- **`DataTableRowActions`**: Menú contextual (tres puntos) para acciones por fila.
- **`DataTableFloatingBar`**: Barra flotante que aparece solo cuando hay filas seleccionadas.

---

## 🛠️ 2. Configuración de Columnas (`ColumnDef`)

Las columnas definen cómo se ve y se comporta la tabla. Es vital usar la propiedad `meta` para habilitar los filtros automáticos en el toolbar.

### Ejemplo de Columna de Selección
```tsx
{
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
}
```

### Ejemplo de Columna con Filtro Facetado (Multi-Select)
```tsx
{
  accessorKey: "status",
  header: ({ column }) => (
    <DataTableColumnHeader column={column} label="Estado" />
  ),
  cell: ({ row }) => {
    const status = row.getValue("status") as string;
    return <Badge>{status}</Badge>;
  },
  filterFn: (row, id, value) => value.includes(row.getValue(id)),
  meta: {
    label: "Estado",
    variant: "multiSelect", // Esto activa el filtro en el toolbar
    options: [
      { label: "Todo", value: "todo", icon: CircleIcon },
      { label: "Done", value: "done", icon: CheckIcon },
    ],
  },
}
```

---

## ⚡ 3. Acciones de Fila y Masivas

### Acciones por Fila (`DataTableRowActions`)
Para añadir un menú de acciones a cada fila, añade esta columna al final:
```tsx
{
  id: "actions",
  cell: ({ row }) => <DataTableRowActions row={row} />,
}
```
*Edita `src/components/data-table/data-table-row-actions.tsx` para cambiar las opciones (Editar, Borrar, etc.).*

### Acciones Masivas (`DataTableFloatingBar`)
La barra flotante se integra mediante la prop `actionBar` del componente `DataTable`:
```tsx
<DataTable
  table={table}
  actionBar={<DataTableFloatingBar table={table} />}
>
  <DataTableToolbar table={table} />
</DataTable>
```

---

## 🔍 4. Tipos de Filtros Soportados (Propiedad `meta.variant`)

El `DataTableToolbar` renderiza automáticamente el componente adecuado según el `variant` definido en la columna:

| Variante | Descripción | Componente |
| :--- | :--- | :--- |
| `text` | Búsqueda por texto libre. | `Input` |
| `select` | Selección única de opciones. | `DataTableFacetedFilter` |
| `multiSelect`| Selección múltiple con badges. | `DataTableFacetedFilter` |
| `number` | Filtro numérico. | `Input[type=number]` |
| `date` | Selección de una fecha. | `DataTableDateFilter` |
| `dateRange` | Rango de fechas. | `DataTableDateFilter` |

---

## 🌐 5. Integración con Backend (Fastify)

Para que la tabla sea eficiente con miles de datos, el filtrado y la paginación deben ocurrir en el servidor.

### Cliente (React)
Debes pasar los estados de la tabla (`sorting`, `columnFilters`, `pagination`) a tu llamada de API:
```tsx
const { data } = useQuery({
  queryKey: ['tasks', sorting, columnFilters, pagination],
  queryFn: () => fetchTasks({
    page: pagination.pageIndex + 1,
    perPage: pagination.pageSize,
    sort: sorting[0]?.id + "." + (sorting[0]?.desc ? "desc" : "asc"),
    filters: JSON.stringify(columnFilters),
  }),
});
```

### Servidor (Fastify + Drizzle)
```typescript
const { page, perPage, sort, filters } = request.query;

// 1. Parsear filtros
const parsedFilters = filters ? JSON.parse(filters) : [];

// 2. Construir la consulta base
let dbQuery = db.select().from(tasksTable);

// 3. Aplicar filtros dinámicos
for (const f of parsedFilters) {
  if (f.variant === 'multiSelect') {
    dbQuery = dbQuery.where(inArray(tasksTable[f.id], f.value));
  } else if (f.variant === 'text') {
    dbQuery = dbQuery.where(ilike(tasksTable[f.id], `%${f.value}%`));
  }
}

// 4. Paginación
const data = await dbQuery
  .limit(perPage)
  .offset((page - 1) * perPage)
  .orderBy(sortColumn);
```

---

## 🚀 6. Checklist para un Nuevo Ejemplo Completo

1. **Definir el Esquema**: Crea un tipo o interface para tus datos (ej. `User`, `Product`).
2. **Crear Columnas**: Define tus `ColumnDef` con `DataTableColumnHeader` y `meta`.
3. **Inicializar la Tabla**: Usa el hook `useReactTable` de TanStack.
4. **Renderizar**: Usa `<DataTable>`, `<DataTableToolbar>` y `<DataTableFloatingBar>`.
5. **Feedback**: Usa `sonner` para las notificaciones en las acciones.

---

## 💡 Pro-Tips
- **Sincronización de URL**: Usa la librería `nuqs` para que los filtros persistan al recargar la página (ver `src/lib/parsers.ts`).
- **Esqueletos**: Usa `DataTableSkeleton` mientras `isLoading` sea true para una carga suave.
- **Kbd**: Usa el componente `<Kbd>Esc</Kbd>` en tus tooltips o barras para indicar atajos de teclado.
