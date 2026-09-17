import { useMutation } from '@tanstack/react-query';

import { createGenericQueries } from '@/hooks/use-crud';

import { companiesService } from './companies.service';
import { CompanyNotifyPayload } from './companies.types';

export const companiesQueries = {
  ...createGenericQueries(companiesService, 'companies'),

  useNotify: () => {
    return useMutation<any, Error, { companyId: string; payload: CompanyNotifyPayload }>({
      mutationFn: ({ companyId, payload }) => companiesService.notify(companyId, payload),
    });
  },
};

