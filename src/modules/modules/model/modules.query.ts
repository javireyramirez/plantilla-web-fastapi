import { createGenericQueries } from '@/hooks/use-crud';

import { modulesService } from './modules.service';

export const modulesQueries = createGenericQueries(modulesService, 'modules');
