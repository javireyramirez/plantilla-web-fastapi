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
        dateFilter: {
          ...defaultDataTableI18n.dateFilter,
        },
        toolbar: {
          ...defaultDataTableI18n.toolbar,
        },
        viewOptions: {
          ...defaultDataTableI18n.viewOptions,
        },
        facetedFilter: {
          ...defaultDataTableI18n.facetedFilter,
        },
        pagination: {
          ...defaultDataTableI18n.pagination,
        },
        table: {
          ...defaultDataTableI18n.table,
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
