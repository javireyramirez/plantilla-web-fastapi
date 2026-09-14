import { useTranslation } from 'react-i18next';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'sonner';

import {
  DataTableI18nProvider,
  defaultDataTableI18n,
} from '@/components/data-table/data-table-i18n';
import { ThemeProvider } from '@/components/theme/theme-provider';
import '@/index.css';
import Router from '@/router';

export default function App() {
  const { t } = useTranslation();

  return (
    <DataTableI18nProvider
      i18n={{
        ...defaultDataTableI18n,
        selector: {
          placeholder: t('dataTable.selector.placeholder'),
          searchPlaceholder: t('dataTable.selector.searchPlaceholder'),
          emptyMessage: t('dataTable.selector.emptyMessage'),
          refineMessage: t('dataTable.selector.refineMessage'),
          applyLabel: t('dataTable.selector.applyLabel'),
        },
        viewOptions: {
          ...defaultDataTableI18n.viewOptions,
          title: t('dataTable.viewOptions.title', { defaultValue: defaultDataTableI18n.viewOptions.title }),
          toggleColumns: t('dataTable.viewOptions.toggleColumns', { defaultValue: defaultDataTableI18n.viewOptions.toggleColumns }),
          searchPlaceholder: t('dataTable.viewOptions.searchPlaceholder', { defaultValue: defaultDataTableI18n.viewOptions.searchPlaceholder }),
          emptyMessage: t('dataTable.viewOptions.emptyMessage', { defaultValue: defaultDataTableI18n.viewOptions.emptyMessage }),
        },
        toolbar: {
          ...defaultDataTableI18n.toolbar,
          resetFilters: t('dataTable.toolbar.resetFilters', { defaultValue: defaultDataTableI18n.toolbar.resetFilters }),
        },
        table: {
          ...defaultDataTableI18n.table,
          selectAll: t('dataTable.table.selectAll', { defaultValue: defaultDataTableI18n.table.selectAll }),
          selectRow: t('dataTable.table.selectRow', { defaultValue: defaultDataTableI18n.table.selectRow }),
          noResults: t('dataTable.table.noResults', { defaultValue: defaultDataTableI18n.table.noResults }),
        },
        pagination: {
          ...defaultDataTableI18n.pagination,
          rowsPerPage: t('dataTable.pagination.rowsPerPage', { defaultValue: defaultDataTableI18n.pagination.rowsPerPage }),
          firstPage: t('dataTable.pagination.firstPage', { defaultValue: defaultDataTableI18n.pagination.firstPage }),
          previousPage: t('dataTable.pagination.previousPage', { defaultValue: defaultDataTableI18n.pagination.previousPage }),
          nextPage: t('dataTable.pagination.nextPage', { defaultValue: defaultDataTableI18n.pagination.nextPage }),
          lastPage: t('dataTable.pagination.lastPage', { defaultValue: defaultDataTableI18n.pagination.lastPage }),
          page: (page, total) => t('dataTable.pagination.page', { page, total, defaultValue: `Página ${page} de ${total}` }),
        },
        dateFilter: {
          ...defaultDataTableI18n.dateFilter,
        },
        facetedFilter: {
          ...defaultDataTableI18n.facetedFilter,
        },
        mobile: {
          ...defaultDataTableI18n.mobile,
        },
      }}
    >
      <ThemeProvider defaultTheme="system" storageKey="vite-ui-theme">
        <Toaster />
        <BrowserRouter>
          <Router />
        </BrowserRouter>
      </ThemeProvider>
    </DataTableI18nProvider>
  );
}
