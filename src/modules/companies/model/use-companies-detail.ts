import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { useEffect } from 'react';

import { companiesQueries } from './companies.query';
import { CreateCompany, CreateCompanyBodySchema, UpdateCompany } from './companies.schema';

export function useCompanyForm(id?: string) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const isEditing = !!id;

  const { data, isLoading, isFetching } = companiesQueries.useGetById(id as string, {
    enabled: isEditing,
  });

  const { mutate: create, isPending: isCreating } = companiesQueries.useCreate();
  const { mutate: update, isPending: isUpdating } = companiesQueries.useUpdate();
  const { mutate: softDelete, isPending: isDeleting } = companiesQueries.useSoftDelete();
  const { mutate: mutateExport, isPending: isPendingExport } = companiesQueries.useExport();

  const handleSubmit = (
    formData: CreateCompany | UpdateCompany,
    options?: { shouldClose?: boolean }
  ) => {
    const { owner, ...clean } = formData;
    const shouldClose = options?.shouldClose ?? false;

    if (isEditing) {
      update(
        { id, body: clean as UpdateCompany },
        {
          onSuccess: () => {
            toast.success(t('companies.form.update'));
            if (shouldClose) navigate('/companies');
          },
          onError: (error: any) => {
            const serverMessage = error?.response?.data?.message || error?.message;
            toast.error(serverMessage || t('companies.form.errors.update'));
          },
        }
      );
    } else {
      create(clean as CreateCompany, {
        onSuccess: (newCompany) => {
          toast.success(t('companies.form.create'));

          if (shouldClose) {
            navigate('/companies');
          } else if (newCompany?.id) {
            navigate(`/companies/edit/${newCompany.id}`);
          } else {
            navigate('/companies');
          }
        },
        onError: (error: any) => {
          const serverMessage = error?.response?.data?.message || error?.message;
          toast.error(serverMessage || t('companies.form.errors.create'));
        },
      });
    }
  };

  const handleDelete = () => {
    if (!id) return;

    softDelete(id, {
      onSuccess: () => {
        toast.success(t('companies.form.delete'));
        navigate('/companies');
      },
      onError: (error: any) => {
        const serverMessage = error?.response?.data?.message || error?.message;
        toast.error(serverMessage || t('companies.form.errors.delete'));
      },
    });
  };

  const form = useForm<CreateCompany>({
    resolver: zodResolver(CreateCompanyBodySchema),
    mode: 'onBlur',
    defaultValues: data ?? { name: '', nif: '', sector: '' },
  });

  // --- Sincronización del formulario con el backend ---
  useEffect(() => {
    if (isEditing) {
      if (!isLoading && !isFetching && data) {
        form.reset(data);
      }
    } else {
      form.reset({ name: '', nif: '', sector: '' });
    }
  }, [isEditing, data, isLoading, isFetching, form]);

  const companyName = useWatch({ control: form.control, name: 'name' });

  const handleExport = () => {
    if (!id) return;
    mutateExport(
      {
        ids: [id],
      },
      {
        onSuccess: () => {
          toast.success(t('companies.exportSuccess', 'Exportado con éxito'));
        },
        onError: (error: any) => {
          const serverMessage = error?.response?.data?.message || error?.message;
          toast.error(serverMessage || t('companies.exportError', 'Error al exportar'));
        },
      }
    );
  };

  return {
    data,
    isEditing,
    companyName,
    isLoading,
    form,
    handleSubmit,
    handleDelete,
    handleExport,
    isPending: isCreating || isUpdating || isDeleting || isPendingExport,
  };
}
