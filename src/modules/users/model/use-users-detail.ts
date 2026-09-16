import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { useEffect } from 'react';

import { usersQueries } from './users.query';
import {
  CreateUsers,
  CreateUsersBodySchema,
  UpdateUsers,
  UpdateUsersBodySchema,
} from './users.schema';

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
  const { mutateAsync: mutateExport, isPending: isPendingExport } = usersQueries.useExport();

  const handleSubmit = (
    formData: CreateUsers | UpdateUsers,
    options?: { shouldClose?: boolean }
  ) => {
    const shouldClose = options?.shouldClose ?? false;

    if (isEditing) {
      const payload = {
        ...formData,
      };
      update(
        { id, body: payload as UpdateUsers },
        {
          onSuccess: () => {
            toast.success(t('users.form.update'));
            if (shouldClose) navigate('/admin/users');
          },
          onError: (error: any) => {
            const serverMessage = error?.response?.data?.message || error?.message;
            toast.error(serverMessage || t('users.form.errors.update'));
          },
        }
      );
    } else {
      const createData = formData as CreateUsers;
      const cleanPayload: Record<string, any> = {
        name: createData.name,
        email: createData.email,
        send_invitation_email: Boolean(createData.send_invitation_email),
        is_active: createData.is_active ?? true,
        is_super_admin: createData.is_super_admin ?? false,
        role_ids: createData.role_ids ?? [],
      };

      if (!createData.send_invitation_email && createData.password) {
        cleanPayload.password = createData.password;
      }

      create(cleanPayload as CreateUsers, {
        onSuccess: (newUsers) => {
          toast.success(t('users.form.create'));

          if (shouldClose) {
            navigate('/admin/users');
          } else if (newUsers?.id) {
            navigate(`/admin/users/edit/${newUsers.id}`);
          } else {
            navigate('/admin/users');
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
        navigate('/admin/users');
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
        password: '',
        send_invitation_email: false,
        is_active: true,
        is_super_admin: false,
        role_ids: [] as string[],
      };

  const form = useForm<any>({
    resolver: zodResolver(isEditing ? UpdateUsersBodySchema : CreateUsersBodySchema),
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
      form.reset({
        name: '',
        email: '',
        password: '',
        send_invitation_email: false,
        is_active: true,
        is_super_admin: false,
        role_ids: [],
      });
    }
  }, [isEditing, data, isLoading, isFetching, form]);

  const userName = useWatch({ control: form.control, name: 'name' });
  const isActive = data?.isActive ?? (data as any)?.is_active ?? true;
  const handleExport = async (format: string = 'csv') => {
    if (!id) return;
    try {
      await mutateExport({
        ids: [id],
        format,
      });
      toast.success(t('export.success', { defaultValue: 'Exportado con éxito' }));
    } catch (error: any) {
      const serverMessage = error?.response?.data?.message || error?.message;
      toast.error(serverMessage || t('export.error', { defaultValue: 'Error al exportar' }));
    }
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
