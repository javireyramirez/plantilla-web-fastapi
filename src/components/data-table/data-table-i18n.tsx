import * as React from 'react';

export interface DataTableI18n {
  selector: {
    placeholder: string;
    searchPlaceholder: string;
    emptyMessage: string;
    refineMessage: string;
    applyLabel: string;
  };
  dateFilter: {
    selectDate: string;
    selectDateRange: string;
    clearSingle: string;
    clearRange: string;
    clearFilterAria: string;
    selectDateLabel: string;
    selectDateRangeLabel: string;
    apply: string;
  };
  toolbar: {
    resetFilters: string;
  };
  viewOptions: {
    toggleColumns: string;
    title: string;
    searchPlaceholder: string;
    emptyMessage: string;
  };
  facetedFilter: {
    clearFilterAria: string;
    selectedCount: (selected: number) => string;
    clearFilters: string;
    searchPlaceholder: string;
    emptyMessage: string;
  };
  pagination: {
    selectedRows: (selected: number, total: number) => string;
    rowsPerPage: string;
    page: (page: number, total: number) => string;
    firstPage: string;
    previousPage: string;
    nextPage: string;
    lastPage: string;
  };
  table: {
    selectAll: string;
    selectRow: string;
    noResults: string;
  };
  mobile: {
    noResults: string;
  };
}

export const defaultDataTableI18n: DataTableI18n = {
  selector: {
    placeholder: 'Seleccionar...',
    searchPlaceholder: 'Buscar...',
    emptyMessage: 'Sin resultados.',
    refineMessage: 'más resultados, refina tu búsqueda',
    applyLabel: 'Aplicar',
  },
  dateFilter: {
    selectDate: 'Seleccionar fecha',
    selectDateRange: 'Seleccionar rango de fechas',
    clearSingle: 'Limpiar fecha',
    clearRange: 'Limpiar rango',
    clearFilterAria: 'Limpiar filtro de fecha',
    selectDateLabel: 'Seleccionar fecha',
    selectDateRangeLabel: 'Seleccionar rango de fechas',
    apply: 'Aplicar',
  },
  toolbar: {
    resetFilters: 'Reiniciar filtros',
  },
  viewOptions: {
    toggleColumns: 'Columnas seleccionadas',
    title: 'Vista',
    searchPlaceholder: 'Buscar columnas...',
    emptyMessage: 'Sin resultados.',
  },
  facetedFilter: {
    clearFilterAria: 'Clear filter',
    selectedCount: (selected) => `${selected} selected`,
    clearFilters: 'Clear filters',
    searchPlaceholder: 'Buscar...',
    emptyMessage: 'No results found.',
  },
  pagination: {
    selectedRows: (selected, total) => `${selected} de ${total} fila(s) seleccionadas.`,
    rowsPerPage: 'Filas por página',
    page: (page, total) => `Página ${page} de ${total}`,
    firstPage: 'Primera página',
    previousPage: 'Página anterior',
    nextPage: 'Página siguiente',
    lastPage: 'Última página',
  },
  table: {
    selectAll: 'Seleccionar todo',
    selectRow: 'Seleccionar fila',
    noResults: 'Sin resultados.',
  },
  mobile: {
    noResults: 'Sin resultados.',
  },
};

const DataTableI18nContext = React.createContext<DataTableI18n>(defaultDataTableI18n);

export function DataTableI18nProvider({
  children,
  i18n,
}: {
  children: React.ReactNode;
  i18n: DataTableI18n;
}) {
  return <DataTableI18nContext.Provider value={i18n}>{children}</DataTableI18nContext.Provider>;
}

export function useDataTableI18n() {
  return React.useContext(DataTableI18nContext);
}
