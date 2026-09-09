import { createGenericQueries } from '@/hooks/use-crud';

import { companiesService } from './companies.service';

export const companiesQueries = createGenericQueries(companiesService, 'companies');
