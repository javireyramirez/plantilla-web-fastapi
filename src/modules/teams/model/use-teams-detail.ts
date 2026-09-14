import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, useWatch } from 'react-hook-form';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

import { useEffect } from 'react';

import { slugify } from '@/lib/utils';

import { teamsQueries } from './teams.query';
import { CreateTeam, CreateTeamBodySchema, UpdateTeam } from './teams.schema';

export function useTeamForm(id?: string) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const isEditing = !!id;

  const { data, isLoading, isFetching } = teamsQueries.useGetById(id as string, {
    enabled: isEditing,
  });

  const { mutate: create, isPending: isCreating } = teamsQueries.useCreate();
  const { mutate: update, isPending: isUpdating } = teamsQueries.useUpdate();
  const { mutate: softDelete, isPending: isDeleting } = teamsQueries.useSoftDelete();

  const handleSubmit = (formData: CreateTeam | UpdateTeam, options?: { shouldClose?: boolean }) => {
    const payload = {
      ...formData,
      slug: slugify(formData.name),
    };

    const shouldClose = options?.shouldClose ?? false;

    if (isEditing) {
      update(
        { id, body: payload as UpdateTeam },
        {
          onSuccess: () => {
            toast.success(t('teams.form.update'));
            if (shouldClose) navigate('/admin/teams');
          },
          onError: (error: any) => {
            const serverMessage = error?.response?.data?.message || error?.message;
            toast.error(serverMessage || t('teams.form.errors.update'));
          },
        }
      );
    } else {
      create(payload as CreateTeam, {
        onSuccess: (newTeam) => {
          toast.success(t('teams.form.create'));

          if (shouldClose) {
            navigate('/admin/teams');
          } else if (newTeam?.id) {
            navigate(`/admin/teams/edit/${newTeam.id}`);
          } else {
            navigate('/admin/teams');
          }
        },
        onError: (error: any) => {
          const serverMessage = error?.response?.data?.message || error?.message;
          toast.error(serverMessage || t('teams.form.errors.create'));
        },
      });
    }
  };

  const handleDelete = () => {
    if (!id) return;

    softDelete(id, {
      onSuccess: () => {
        toast.success(t('teams.form.delete'));
        navigate('/admin/teams');
      },
      onError: (error: any) => {
        const serverMessage = error?.response?.data?.message || error?.message;
        toast.error(serverMessage || t('teams.form.errors.delete'));
      },
    });
  };

  const form = useForm<CreateTeam>({
    resolver: zodResolver(CreateTeamBodySchema),
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

  const teamName = useWatch({ control: form.control, name: 'name' });

  return {
    data,
    isEditing,
    teamName,
    isLoading,
    form,
    handleSubmit,
    handleDelete,
    isPending: isCreating || isUpdating || isDeleting,
  };
}
