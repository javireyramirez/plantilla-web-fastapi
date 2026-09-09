import { UserPlus } from 'lucide-react';
import { useTranslation } from 'react-i18next';

import * as React from 'react';

import { Selector } from '@/components/selector/selector';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
// NOTE: this is a placeholder adapter. Point it at your real "list users"
// query (org members, better-auth users, etc.) and map its response into
// { id, name }[] — that's all Selector needs.
import { usersQueries } from '@/modules/users/model/users.query';
import { GetUsersQuery } from '@/modules/users/model/users.schema';

interface AddMembersDrawerProps {
  excludeUserIds: string[];
  onAddMembers: (userIds: string[]) => void;
  isAdding?: boolean;
}

function useUsersOptions(params: {
  page?: number;
  limit: number;
  isTrash?: boolean;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
  name?: string;
}) {
  // NOTE: swap for your actual users list hook/endpoint.
  const { name, ...rest } = params;
  const { data, isLoading } = usersQueries.useGetAll({
    page: rest.page ?? 1,
    isTrash: rest.isTrash ?? false,
    ...rest,
    sortBy: rest.sortBy as GetUsersQuery['sortBy'],
    name: name,
  });
  return {
    data:
      data?.data?.map((u: { id: string; name?: string | null; email?: string | null }) => ({
        id: u.id,
        name: u.name ?? u.email ?? u.id,
      })) ?? [],
    isLoading,
  };
}

export function AddMembersDrawer({
  excludeUserIds,
  onAddMembers,
  isAdding,
}: AddMembersDrawerProps) {
  const { t } = useTranslation();
  const [open, setOpen] = React.useState(false);
  const [selectedUserIds, setSelectedUserIds] = React.useState<string[]>([]);

  React.useEffect(() => {
    if (!open) {
      setSelectedUserIds([]);
    }
  }, [open]);

  const handleApply = React.useCallback(() => {
    onAddMembers(selectedUserIds);
    setOpen(false);
  }, [onAddMembers, selectedUserIds]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button size="sm" className="gap-2">
          <UserPlus className="h-4 w-4" />
          {t('teamMembers.add')}
        </Button>
      </SheetTrigger>

      <SheetContent side="right" className="flex w-full flex-col gap-4 sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{t('teamMembers.addTitle')}</SheetTitle>
          <SheetDescription>{t('teamMembers.addDescription')}</SheetDescription>
        </SheetHeader>

        <div className="flex-1 min-h-0">
          <Selector
            multiple
            applyButton={false}
            disabled={isAdding}
            value={selectedUserIds}
            onChange={setSelectedUserIds}
            excludeIds={excludeUserIds}
            useGetList={useUsersOptions}
            placeholder={t('teamMembers.selectUser')}
            searchPlaceholder={t('teamMembers.searchUser')}
            emptyMessage={t('teamMembers.noUsersFound')}
          />
        </div>

        <div className="flex items-center justify-end gap-2 border-t pt-4">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={isAdding}>
            {t('teams.cancel')}
          </Button>
          <Button onClick={handleApply} disabled={isAdding || selectedUserIds.length === 0}>
            {t('dataTable.selector.applyLabel')}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}
