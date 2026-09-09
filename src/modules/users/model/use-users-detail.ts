import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { useEffect } from 'react';

import { usersQueries } from './users.query';
import { CreateUsers, CreateUsersBodySchema, UpdateUsers } from './users.schema';

export function useUsersForm(id?: string) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const isEditing = !!id;

  const { data, isLoading, isFetching } = usersQueries.useGetById(id as string, {
    enabled: isEditing,
  });

  const { mutate: create, isPending: isCreating } = usersQueries.useCreate();
  const { mutate: update, isPending: isUpdating } = usersQueries.useUpdate();
  const { mutate: softDelete, isPending: isDeleting } = usersQueries.useSoftDelete();
  const { mutate: suspend, isPending: isSuspending } = usersQueries.useSuspend();
  const { mutate: unsuspend, isPending: isUnsuspending } = usersQueries.useUnsuspend();
  const { mutate: resendInvitation, isPending: isResendingInvitation } =
    usersQueries.useResendInvitation();
  const { mutate: mutateExport, isPending: isPendingExport } = usersQueries.useExport();

  const handleSubmit = (
    formData: CreateUsers | UpdateUsers,
    options?: { shouldClose?: boolean }
  ) => {
    const payload = {
      ...formData,
    };

    const shouldClose = options?.shouldClose ?? false;

    if (isEditing) {
      update(
        { id, body: payload as UpdateUsers },
        {
          onSuccess: () => {
            toast.success(t('users.form.update'));
            if (shouldClose) navigate('/users');
          },
          onError: (error: any) => {
            const serverMessage = error?.response?.data?.message || error?.message;
            toast.error(serverMessage || t('users.form.errors.update'));
          },
        }
      );
    } else {
      create(payload as CreateUsers, {
        onSuccess: (newUsers) => {
          toast.success(t('users.form.create'));

          if (shouldClose) {
            navigate('/users');
          } else if (newUsers?.id) {
            navigate(`/users/edit/${newUsers.id}`);
          } else {
            navigate('/users');
          }
        },
        onError: (error: any) => {
          const serverMessage = error?.response?.data?.message || error?.message;
          toast.error(serverMessage || t('users.form.errors.create'));
        },
      });
    }
  };

  const handleDelete = () => {
    if (!id) return;

    softDelete(id, {
      onSuccess: () => {
        toast.success(t('users.form.delete'));
        navigate('/users');
      },
      onError: (error: any) => {
        const serverMessage = error?.response?.data?.message || error?.message;
        toast.error(serverMessage || t('users.form.errors.delete'));
      },
    });
  };

  const handleSuspend = () => {
    if (!id) return;

    suspend(id, {
      onSuccess: () => {
        toast.success(t('users.form.suspend'));
      },
      onError: (error: any) => {
        const serverMessage = error?.response?.data?.message || error?.message;
        toast.error(serverMessage || t('users.form.errors.suspend'));
      },
    });
  };

  const handleUnSuspend = () => {
    if (!id) return;

    unsuspend(id, {
      onSuccess: () => {
        toast.success(t('users.form.unsuspend'));
      },
      onError: (error: any) => {
        const serverMessage = error?.response?.data?.message || error?.message;
        toast.error(serverMessage || t('users.form.errors.unsuspend'));
      },
    });
  };

  const handleResendInvitation = () => {
    if (!id) return;

    resendInvitation(id, {
      onSuccess: () => {
        toast.success(t('users.form.resendInvitation'));
      },
      onError: (error: any) => {
        const serverMessage = error?.response?.data?.message || error?.message;
        toast.error(serverMessage || t('users.form.errors.resendInvitation'));
      },
    });
  };

  const formDefaultValues = data
    ? {
        name: data.name ?? '',
        email: data.email ?? '',
      }
    : {
        name: '',
        email: '',
      };

  const form = useForm<CreateUsers>({
    resolver: zodResolver(CreateUsersBodySchema),
    mode: 'onBlur',
    defaultValues: formDefaultValues,
  });

  useEffect(() => {
    if (isEditing) {
      if (!isLoading && !isFetching && data) {
        form.reset({
          name: data?.name ?? '',
          email: data?.email ?? '',
        });
      }
    } else {
      form.reset({ name: '' });
    }
  }, [isEditing, data, isLoading, isFetching, form]);

  const userName = useWatch({ control: form.control, name: 'name' });
  const isActive = data?.isActive ?? false;
  const handleExport = () => {
    if (!id) return;
    mutateExport(
      {
        ids: [id],
      },
      {
        onSuccess: () => {
          toast.success(t('users.exportSuccess', 'Exportado con éxito'));
        },
        onError: (error: any) => {
          const serverMessage = error?.response?.data?.message || error?.message;
          toast.error(serverMessage || t('users.exportError', 'Error al exportar'));
        },
      }
    );
  };

  return {
    data,
    isEditing,
    userName,
    isActive,
    isLoading,
    form,
    handleSubmit,
    handleDelete,
    handleSuspend,
    handleUnSuspend,
    handleResendInvitation,
    handleExport,

    isPending:
      isCreating ||
      isUpdating ||
      isDeleting ||
      isSuspending ||
      isUnsuspending ||
      isResendingInvitation ||
      isPendingExport,
  };
}
