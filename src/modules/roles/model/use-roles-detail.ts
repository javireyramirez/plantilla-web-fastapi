import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { useEffect } from 'react';

import { slugify } from '@/lib/utils';

import { rolesQueries } from './roles.query';
import { CreateRole, CreateRoleBodySchema, UpdateRole } from './roles.schema';

export function useRoleForm(id?: string) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const isEditing = !!id;

  const { data, isLoading, isFetching } = rolesQueries.useGetById(id as string, {
    enabled: isEditing,
  });

  const { mutate: create, isPending: isCreating } = rolesQueries.useCreate();
  const { mutate: update, isPending: isUpdating } = rolesQueries.useUpdate();
  const { mutate: softDelete, isPending: isDeleting } = rolesQueries.useSoftDelete();
  const { mutate: mutateExport, isPending: isPendingExport } = rolesQueries.useExport();

  const handleSubmit = (formData: CreateRole | UpdateRole, options?: { shouldClose?: boolean }) => {
    const payload = {
      ...formData,
      slug: slugify(formData.name),
    };

    const shouldClose = options?.shouldClose ?? false;

    if (isEditing) {
      update(
        { id, body: payload as UpdateRole },
        {
          onSuccess: () => {
            toast.success(t('roles.form.update'));
            if (shouldClose) navigate('/roles');
          },
          onError: (error: any) => {
            const serverMessage = error?.response?.data?.message || error?.message;
            toast.error(serverMessage || t('roles.form.errors.update'));
          },
        }
      );
    } else {
      create(payload as CreateRole, {
        onSuccess: (newRole) => {
          toast.success(t('roles.form.create'));

          if (shouldClose) {
            navigate('/roles');
          } else if (newRole?.id) {
            navigate(`/roles/edit/${newRole.id}`);
          } else {
            navigate('/roles');
          }
        },
        onError: (error: any) => {
          const serverMessage = error?.response?.data?.message || error?.message;
          toast.error(serverMessage || t('roles.form.errors.create'));
        },
      });
    }
  };

  const handleDelete = () => {
    if (!id) return;

    softDelete(id, {
      onSuccess: () => {
        toast.success(t('roles.form.delete'));
        navigate('/roles');
      },
      onError: (error: any) => {
        const serverMessage = error?.response?.data?.message || error?.message;
        toast.error(serverMessage || t('roles.form.errors.delete'));
      },
    });
  };

  const form = useForm<CreateRole>({
    resolver: zodResolver(CreateRoleBodySchema),
    mode: 'onBlur',
    defaultValues: {
      name: data?.name ?? '',
      description: data?.description ?? '',
    },
  });

  // --- Sincronización del formulario con el backend ---
  useEffect(() => {
    if (isEditing) {
      if (!isLoading && !isFetching && data) {
        form.reset({
          name: data?.name ?? '',
          description: data?.description ?? '',
        });
      }
    } else {
      form.reset({ name: '', description: '' });
    }
  }, [isEditing, data, isLoading, isFetching, form]);

  const roleName = useWatch({ control: form.control, name: 'name' });

  const handleExport = () => {
    if (!id) return;
    mutateExport(
      {
        ids: [id],
      },
      {
        onSuccess: () => {
          toast.success(t('roles.exportSuccess', 'Exportado con éxito'));
        },
        onError: (error: any) => {
          const serverMessage = error?.response?.data?.message || error?.message;
          toast.error(serverMessage || t('roles.exportError', 'Error al exportar'));
        },
      }
    );
  };

  return {
    data,
    isEditing,
    roleName,
    isLoading,
    form,
    handleSubmit,
    handleDelete,
    handleExport,
    isPending: isCreating || isUpdating || isDeleting || isPendingExport,
  };
}
