import { ArrowLeft, FileCode, History, Info } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useParams } from 'react-router-dom';

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuditDetail } from '../model/use-audit-detail';
import { getEntityLink } from '../model/audit.types';

export default function AuditDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { auditLog, isLoading } = useAuditDetail(id);

  if (isLoading) {
    return (
      <div className="space-y-6 mx-auto p-4 md:p-6">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-4 w-4 rounded-full" />
          <Skeleton className="h-4 w-32" />
        </div>

        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-card p-4 rounded-xl border shadow-sm">
          <div className="space-y-2 w-full sm:w-auto">
            <div className="flex items-center gap-2">
              <Skeleton className="h-5 w-5 rounded-md" />
              <Skeleton className="h-6 w-48" />
            </div>
            <Skeleton className="h-4 w-64 hidden sm:block" />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Skeleton className="h-10 w-24" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          <Skeleton className="h-64 lg:col-span-1" />
          <Skeleton className="h-64 lg:col-span-2" />
        </div>
      </div>
    );
  }

  if (!auditLog) {
    return (
      <div className="flex flex-col items-center justify-center p-8 border rounded-xl bg-card text-center gap-4">
        <Info className="h-12 w-12 text-muted-foreground" />
        <h2 className="text-xl font-bold">{t('audit.notFoundTitle', 'Registro no encontrado')}</h2>
        <p className="text-muted-foreground">{t('audit.notFoundDesc', 'El registro de auditoría solicitado no existe o no tiene permisos para verlo.')}</p>
        <Button onClick={() => navigate(-1)} variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" /> {t('audit.back')}
        </Button>
      </div>
    );
  }

  const dateVal = auditLog.createdAt;
  const formattedDate = dateVal
    ? new Date(dateVal).toLocaleString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    : '-';

  const link = auditLog.action !== 'LOGIN' && auditLog.action !== 'LOGOUT' ? getEntityLink(auditLog.moduleSlug, auditLog.entityId) : null;

  return (
    <div className="space-y-6 mx-auto p-4 md:p-6">
      {/* SECCIÓN: Breadcrumb */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild className="transition-colors hover:text-foreground">
                <Link to="/audit">{t('audit.title')}</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbPage className="font-medium text-foreground">
                {t('audit.detail')}
              </BreadcrumbPage>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <Button onClick={() => navigate(-1)} variant="outline" className="w-full sm:w-auto">
          <ArrowLeft className="mr-2 h-4 w-4" /> {t('audit.back')}
        </Button>
      </div>

      {/* SECCIÓN: Header Card */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-card p-4 rounded-xl border shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
              <History className="h-5 w-5 text-muted-foreground flex-shrink-0" />
              {link ? (
                <Link to={link} className="text-blue-500 hover:text-blue-700 hover:underline transition-colors">
                  {auditLog.displayName || t('audit.detail')}
                </Link>
              ) : (
                <span>{auditLog.displayName || t('audit.detail')}</span>
              )}
            </h1>
          </div>
          <p className="text-sm text-muted-foreground">
            {auditLog.description || t('audit.subtitle')}
          </p>
        </div>
      </div>

      {/* SECCIÓN: Detalle del Registro */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Columna Izquierda: Detalles Básicos */}
        <Card className="lg:col-span-1 shadow-sm">
          <CardHeader className="border-b pb-4">
            <CardTitle className="text-base font-semibold">
              {t('audit.details')}
            </CardTitle>
            <CardDescription>
              {t('audit.detailsDescription', 'Información básica del registro de auditoría.')}
            </CardDescription>
          </CardHeader>
          <CardContent className="divide-y divide-border text-sm pt-0">
            <div className="py-3 flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                ID
              </span>
              <span className="font-mono text-xs text-foreground bg-muted/50 p-1.5 rounded border overflow-x-auto select-all">
                {auditLog.id}
              </span>
            </div>

            <div className="py-3 flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t('audit.action')}
              </span>
              <span className="text-foreground font-medium">
                {t(`audit.actions.${auditLog.action}`) || auditLog.action}
              </span>
            </div>

            <div className="py-3 flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t('audit.date')}
              </span>
              <span className="text-foreground font-medium">{formattedDate}</span>
            </div>

            <div className="py-3 flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t('audit.user')}
              </span>
              <span className="text-foreground font-medium">
                {auditLog.user?.name || auditLog.user?.email || auditLog.userId || '-'}
              </span>
              {auditLog.userId && (
                <span className="font-mono text-[10px] text-muted-foreground bg-muted/20 p-1 rounded w-fit select-all">
                  ID: {auditLog.userId}
                </span>
              )}
            </div>

            <div className="py-3 flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t('audit.module')}
              </span>
              <span className="text-foreground capitalize font-medium">
                {(() => {
                  const slug = auditLog.moduleSlug;
                  if (!slug) return '-';
                  const translationKey = `modules.names.${slug}`;
                  const translated = t(translationKey);
                  return translated !== translationKey ? translated : slug;
                })()}
              </span>
            </div>

            {auditLog.entityId && (
              <div className="py-3 flex flex-col gap-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  ID {t('audit.entity')}
                </span>
                <span className="font-mono text-xs text-foreground bg-muted/20 p-1 rounded overflow-x-auto select-all">
                  {auditLog.entityId}
                </span>
              </div>
            )}

            <div className="py-3 flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t('audit.ipAddress')}
              </span>
              <span className="font-mono text-xs text-foreground">{auditLog.ipAddress || '-'}</span>
            </div>

            <div className="py-3 flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t('audit.userAgent')}
              </span>
              <span className="text-xs text-muted-foreground leading-relaxed break-words">
                {auditLog.userAgent || '-'}
              </span>
            </div>
          </CardContent>
        </Card>

        {/* Columna Derecha: Metadatos JSON */}
        <Card className="lg:col-span-2 shadow-sm h-full flex flex-col">
          <CardHeader className="border-b pb-4">
            <CardTitle className="text-base font-semibold flex items-center gap-2">
              <FileCode className="h-4 w-4 text-muted-foreground" />
              {t('audit.metadata')}
            </CardTitle>
            <CardDescription>
              {t('audit.metadataDescription', 'Cambios y datos adicionales del evento.')}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 flex-1 flex flex-col min-h-[300px]">
            {auditLog.metadata ? (
              <div className="p-6 bg-slate-950 dark:bg-zinc-950 text-slate-100 rounded-b-xl flex-1 font-mono text-xs overflow-auto max-h-[500px]">
                <pre>{JSON.stringify(auditLog.metadata, null, 2)}</pre>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground gap-2 p-6">
                <Info className="h-8 w-8 text-muted-foreground/50" />
                <span className="text-sm">{t('audit.noMetadata')}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
