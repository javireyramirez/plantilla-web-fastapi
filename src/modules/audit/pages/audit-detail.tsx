import {
  ArrowLeft,
  ArrowRight,
  Check,
  Copy,
  FileCode,
  History,
  Info,
  ShieldCheck,
  User,
} from 'lucide-react';
import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'sonner';

import { ExportDropdown } from '@/components/export-dropdown';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { usePermissions } from '@/hooks/use-permissions';
import { useModules } from '@/modules/modules/model/modules.query';
import { getAuditActionLabel, getAuditModuleLabel, getEntityLink, normalizeModuleSlug } from '../model/audit.types';
import { useAuditDetail } from '../model/use-audit-detail';

function formatRelativeTime(date: Date): string {
  const diffSeconds = Math.max(0, Math.round((Date.now() - date.getTime()) / 1000));
  if (diffSeconds < 60) return 'hace un momento';
  const diffMinutes = Math.round(diffSeconds / 60);
  if (diffMinutes < 60) return `hace ${diffMinutes} min`;
  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `hace ${diffHours} h`;
  const diffDays = Math.round(diffHours / 24);
  return `hace ${diffDays} d`;
}

function formatDiffValue(val: any): string {
  if (val === null || val === undefined) {
    return 'null';
  }
  if (typeof val === 'boolean') {
    return val ? 'true' : 'false';
  }
  if (typeof val === 'object') {
    return JSON.stringify(val);
  }
  return String(val);
}

const isDiffObject = (val: any): val is { old?: any; new?: any } => {
  return (
    val !== null &&
    typeof val === 'object' &&
    !Array.isArray(val) &&
    ('old' in val || 'new' in val)
  );
};

export default function AuditDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { can } = usePermissions();
  const { modulesMap } = useModules();
  const { auditLog, isLoading, handleExport, isPendingExport } = useAuditDetail(id);
  const [copiedKey, setCopiedKey] = React.useState<string | null>(null);

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    toast.success(t('common.copied', { defaultValue: 'Copiado al portapapeles' }));
    setTimeout(() => setCopiedKey(null), 2000);
  };

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
        <p className="text-muted-foreground">
          {t(
            'audit.notFoundDesc',
            'El registro de auditoría solicitado no existe o no tiene permisos para verlo.'
          )}
        </p>
        <Button onClick={() => navigate(-1)} variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" /> {t('audit.back', { defaultValue: 'Volver' })}
        </Button>
      </div>
    );
  }

  const rawDate = auditLog.created_at ?? auditLog.createdAt;
  const dateObj = rawDate ? new Date(rawDate) : null;
  const formattedDate = dateObj
    ? dateObj.toLocaleString('es-ES', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      })
    : '-';
  const relativeTime = dateObj ? formatRelativeTime(dateObj) : null;

  const entityType = auditLog.entity_type || auditLog.moduleSlug;
  const entityId = auditLog.entity_id || auditLog.entityId;
  const entityName = auditLog.entity_name || auditLog.displayName || '-';
  const slug = entityType ? normalizeModuleSlug(entityType) : '';
  const linkTarget =
    slug === 'settings' ? (entityName !== '-' ? entityName : entityId) : entityId;
  const link =
    auditLog.action !== 'LOGIN' && auditLog.action !== 'LOGOUT'
      ? getEntityLink(slug, linkTarget)
      : null;

  const actor = auditLog.user;
  const actorName = actor?.name || auditLog.actor_name || null;
  const actorEmail = actor?.email || auditLog.actor_email || null;
  const actorId = actor?.id || auditLog.actor_id || auditLog.userId || null;

  const changes = auditLog.changes || auditLog.metadata;
  const changesEntries = changes && typeof changes === 'object' ? Object.entries(changes) : [];

  return (
    <div className="space-y-6 mx-auto p-4 md:p-6">
      {/* SECCIÓN: Breadcrumb y Acciones de cabecera */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild className="transition-colors hover:text-foreground">
                <Link to="/admin/audit">{t('audit.title')}</Link>
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

        <div className="flex items-center gap-2 w-full sm:w-auto">
          {can('audit', 'EXPORT') && (
            <ExportDropdown
              entityName="audit"
              onExport={handleExport}
              disabled={isPendingExport}
              size="sm"
            />
          )}
          <Button
            onClick={() => navigate(-1)}
            variant="outline"
            size="sm"
            className="gap-2 flex-1 sm:flex-none shadow-sm"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('audit.back', { defaultValue: 'Volver' })}
          </Button>
        </div>
      </div>

      {/* SECCIÓN: Header Card */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between bg-card p-5 rounded-xl border shadow-sm">
        <div className="space-y-1">
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <History className="h-5 w-5 text-muted-foreground flex-shrink-0" />
            <span>
              {auditLog.details ||
                `${getAuditActionLabel(t, auditLog.action)} - ${entityName}`}
            </span>
          </h1>
          <p className="text-sm text-muted-foreground">
            {getAuditModuleLabel(t, entityType, modulesMap)} &bull;{' '}
            {link ? (
              <Link
                to={link}
                className="font-medium text-blue-500 hover:text-blue-700 hover:underline"
              >
                {entityName}
              </Link>
            ) : (
              <span>{entityName}</span>
            )}
          </p>
        </div>
      </div>

      {/* SECCIÓN: Detalle del Registro */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Columna Izquierda: Información General (Texto limpio en crudo, sin badges ni ruido) */}
        <Card className="lg:col-span-1 shadow-sm">
          <CardHeader className="border-b pb-4">
            <CardTitle className="text-base font-semibold">
              {t('audit.details', { defaultValue: 'Detalles' })}
            </CardTitle>
            <CardDescription>
              {t('audit.detailsDescription', {
                defaultValue: 'Información general del registro de auditoría.',
              })}
            </CardDescription>
          </CardHeader>
          <CardContent className="divide-y divide-border text-sm pt-0">
            {/* Acción */}
            <div className="py-3.5 flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t('audit.action', { defaultValue: 'Acción' })}
              </span>
              <span className="text-foreground font-medium">
                {getAuditActionLabel(t, auditLog.action)}
              </span>
            </div>

            {/* Fecha y Hora */}
            <div className="py-3.5 flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t('audit.date', { defaultValue: 'Fecha y hora' })}
              </span>
              <span className="text-foreground font-medium">{formattedDate}</span>
              {relativeTime && <span className="text-xs text-muted-foreground">{relativeTime}</span>}
            </div>

            {/* Actor / Usuario */}
            <div className="py-3.5 flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t('audit.user', { defaultValue: 'Usuario' })}
              </span>
              <div className="flex items-center justify-between gap-2">
                <div className="flex flex-col min-w-0">
                  <span className="text-foreground font-medium flex items-center gap-1.5 truncate">
                    <User className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                    {actorName || (
                      <span className="text-muted-foreground italic">
                        Sistema (Proceso automático)
                      </span>
                    )}
                  </span>
                  {actorEmail && (
                    <span className="text-xs text-muted-foreground truncate">{actorEmail}</span>
                  )}
                </div>
                {actorId && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-foreground shrink-0"
                        onClick={() => handleCopy(actorId, 'actorId')}
                      >
                        {copiedKey === 'actorId' ? (
                          <Check className="h-3.5 w-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {t('audit.copyUserId', { defaultValue: 'Copiar ID de usuario' })}
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
            </div>

            {/* Entidad Afectada */}
            <div className="py-3.5 flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t('audit.entity', { defaultValue: 'Entidad' })}
              </span>
              <div className="flex items-center justify-between gap-2">
                <div className="flex flex-col min-w-0">
                  <span className="text-xs text-muted-foreground">
                    {getAuditModuleLabel(t, entityType, modulesMap)}
                  </span>
                  {link ? (
                    <Link
                      to={link}
                      className="font-medium text-blue-500 hover:text-blue-700 hover:underline mt-0.5 truncate"
                    >
                      {entityName}
                    </Link>
                  ) : (
                    <span className="text-foreground font-medium mt-0.5 truncate">
                      {entityName}
                    </span>
                  )}
                </div>
                {entityId && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-foreground shrink-0"
                        onClick={() => handleCopy(entityId, 'entityId')}
                      >
                        {copiedKey === 'entityId' ? (
                          <Check className="h-3.5 w-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {t('audit.copyEntityId', { defaultValue: 'Copiar ID de entidad' })}
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
            </div>

            {/* Dirección IP */}
            <div className="py-3.5 flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t('audit.ipAddress', { defaultValue: 'Dirección IP' })}
              </span>
              <div className="flex items-center justify-between gap-2">
                <span className="font-mono text-xs text-foreground">
                  {auditLog.ip_address || auditLog.ipAddress || (
                    <span className="text-muted-foreground italic font-sans">No registrada</span>
                  )}
                </span>
                {(auditLog.ip_address || auditLog.ipAddress) && (
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-muted-foreground hover:text-foreground shrink-0"
                        onClick={() =>
                          handleCopy(
                            (auditLog.ip_address || auditLog.ipAddress) as string,
                            'ipAddress'
                          )
                        }
                      >
                        {copiedKey === 'ipAddress' ? (
                          <Check className="h-3.5 w-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      {t('audit.copyIp', { defaultValue: 'Copiar IP' })}
                    </TooltipContent>
                  </Tooltip>
                )}
              </div>
            </div>

            {/* Agente de Usuario */}
            <div className="py-3.5 flex flex-col gap-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {t('audit.userAgent', { defaultValue: 'Agente de usuario' })}
              </span>
              <span
                className="text-xs text-muted-foreground leading-relaxed break-words line-clamp-2"
                title={auditLog.user_agent || auditLog.userAgent || undefined}
              >
                {auditLog.user_agent || auditLog.userAgent || (
                  <span className="italic">No registrado</span>
                )}
              </span>
            </div>

            {/* Referencia técnica sutil (ID del log) */}
            <div className="py-3 flex items-center justify-between text-xs text-muted-foreground">
              <span>ID Registro</span>
              <div className="flex items-center gap-1 font-mono text-[11px]">
                <span>
                  {auditLog.id?.slice(0, 8)}...{auditLog.id?.slice(-4)}
                </span>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-muted-foreground hover:text-foreground"
                      onClick={() => handleCopy(auditLog.id, 'logId')}
                    >
                      {copiedKey === 'logId' ? (
                        <Check className="h-3 w-3 text-emerald-500" />
                      ) : (
                        <Copy className="h-3 w-3" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    {t('audit.copyLogId', { defaultValue: 'Copiar ID de auditoría' })}
                  </TooltipContent>
                </Tooltip>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Columna Derecha: Cambios del Evento (Visual Diff en texto crudo + Pestaña JSON) */}
        <Card className="lg:col-span-2 shadow-sm h-full flex flex-col">
          <Tabs defaultValue="diff" className="w-full flex-1 flex flex-col">
            <CardHeader className="border-b pb-3 flex flex-row items-center justify-between gap-4 flex-wrap">
              <div>
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <FileCode className="h-4 w-4 text-muted-foreground" />
                  {t('audit.changesTitle', { defaultValue: 'Modificaciones registradas' })}
                </CardTitle>
                <CardDescription>
                  {t('audit.changesDesc', {
                    defaultValue: 'Diferencias de estado y valores modificados en este evento.',
                  })}
                </CardDescription>
              </div>
              <TabsList className="h-8">
                <TabsTrigger value="diff" className="text-xs">
                  {t('audit.tabDiff', { defaultValue: 'Cambios (Diff)' })}
                </TabsTrigger>
                <TabsTrigger value="json" className="text-xs">
                  {t('audit.tabJson', { defaultValue: 'JSON Crudo' })}
                </TabsTrigger>
              </TabsList>
            </CardHeader>

            <CardContent className="p-0 flex-1 flex flex-col min-h-[320px]">
              {/* Pestaña: Visual Diff con texto en crudo */}
              <TabsContent value="diff" className="m-0 flex-1 flex flex-col p-4">
                {changesEntries.length > 0 ? (
                  <div className="rounded-lg border overflow-hidden">
                    <Table>
                      <TableHeader className="bg-muted/50">
                        <TableRow>
                          <TableHead className="w-[180px] font-semibold text-xs">
                            {t('audit.field', { defaultValue: 'Campo' })}
                          </TableHead>
                          <TableHead className="font-semibold text-xs">
                            {t('audit.previousValue', { defaultValue: 'Valor anterior' })}
                          </TableHead>
                          <TableHead className="w-[30px] p-0 text-center" />
                          <TableHead className="font-semibold text-xs">
                            {t('audit.newValue', { defaultValue: 'Valor nuevo' })}
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {changesEntries.map(([field, diff]) => {
                          const hasOldNew = isDiffObject(diff);
                          return (
                            <TableRow key={field} className="hover:bg-muted/30">
                              <TableCell className="font-medium font-mono text-xs text-foreground align-middle">
                                {field}
                              </TableCell>
                              <TableCell className="align-middle font-mono text-xs text-foreground">
                                {hasOldNew ? (
                                  <span className="text-muted-foreground line-through">
                                    {formatDiffValue(diff.old)}
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground italic">-</span>
                                )}
                              </TableCell>
                              <TableCell className="align-middle text-center p-0">
                                <ArrowRight className="h-3.5 w-3.5 text-muted-foreground inline" />
                              </TableCell>
                              <TableCell className="align-middle font-mono text-xs text-foreground">
                                {hasOldNew ? formatDiffValue(diff.new) : formatDiffValue(diff)}
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="flex-1 flex flex-col items-center justify-center py-12 text-center text-muted-foreground gap-3">
                    <ShieldCheck className="h-10 w-10 text-muted-foreground/50" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium text-foreground">
                        {t('audit.noChangesRecorded', { defaultValue: 'Sin cambios de estado' })}
                      </p>
                      <p className="text-xs text-muted-foreground max-w-sm">
                        {t('audit.noChangesDesc', {
                          defaultValue:
                            'Este evento no modificó atributos de la entidad (p. ej. evento de sesión o lectura).',
                        })}
                      </p>
                    </div>
                  </div>
                )}
              </TabsContent>

              {/* Pestaña: JSON Crudo con Copiar */}
              <TabsContent value="json" className="m-0 flex-1 flex flex-col p-4">
                <div className="relative flex-1 flex flex-col">
                  <div className="absolute top-2 right-2 z-10">
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-7 text-xs gap-1.5 bg-background/80 backdrop-blur shadow-sm"
                      onClick={() => handleCopy(JSON.stringify(auditLog, null, 2), 'rawJson')}
                    >
                      {copiedKey === 'rawJson' ? (
                        <Check className="h-3.5 w-3.5 text-emerald-500" />
                      ) : (
                        <Copy className="h-3.5 w-3.5" />
                      )}
                      {t('common.copy', { defaultValue: 'Copiar' })}
                    </Button>
                  </div>
                  <div className="p-4 bg-slate-950 dark:bg-zinc-950 text-slate-100 rounded-lg flex-1 font-mono text-xs overflow-auto max-h-[500px]">
                    <pre>{JSON.stringify(auditLog, null, 2)}</pre>
                  </div>
                </div>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
}
