import React from 'react';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface FormSkeletonProps {
  /** Número total de tarjetas/grids a renderizar */
  cardsCount?: number;
  /** Columnas en pantallas pequeñas (móvil) */
  colsSm?: 1 | 2 | 3 | 4;
  /** Columnas en pantallas medianas (tablets) */
  colsMd?: 1 | 2 | 3 | 4 | 6;
  /** Columnas en pantallas grandes (escritorio) */
  colsLg?: 1 | 2 | 3 | 4 | 6;
  /** Número de filas de inputs/campos simulados dentro de cada tarjeta */
  rowsPerCard?: number;
  /** Muestra u oculta la sección superior del encabezado/breadcrumbs de tu ejemplo */
  showNavbarSim?: boolean;
}

export const FormSkeleton: React.FC<FormSkeletonProps> = ({
  cardsCount = 3,
  colsSm = 1,
  colsMd = 2,
  colsLg = 3,
  rowsPerCard = 3,
  showNavbarSim = true,
}) => {
  // Mapeos estáticos para evitar que Tailwind purgue las clases dinámicas
  const smColsMap = {
    1: 'sm:grid-cols-1',
    2: 'sm:grid-cols-2',
    3: 'sm:grid-cols-3',
    4: 'sm:grid-cols-4',
  };
  const mdColsMap = {
    1: 'md:grid-cols-1',
    2: 'md:grid-cols-2',
    3: 'md:grid-cols-3',
    4: 'md:grid-cols-4',
    6: 'md:grid-cols-6',
  };
  const lgColsMap = {
    1: 'lg:grid-cols-1',
    2: 'lg:grid-cols-2',
    3: 'lg:grid-cols-3',
    4: 'lg:grid-cols-4',
    6: 'lg:grid-cols-6',
  };

  const gridClasses = `grid grid-cols-1 ${smColsMap[colsSm]} ${mdColsMap[colsMd]} ${lgColsMap[colsLg]} gap-6 items-start`;

  return (
    <div className="space-y-6 mx-auto p-4 md:p-6 w-full">
      {/* 1. Navbar / Header simulado opcional */}
      {showNavbarSim && (
        <>
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
              <Skeleton className="h-10 flex-1 sm:flex-none sm:w-28" />
              <Skeleton className="h-10 w-10 sm:w-24 hidden sm:block" />
            </div>
          </div>

          <div className="border-b pb-2 flex gap-6">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-5 w-28" />
            <Skeleton className="h-5 w-20" />
          </div>
        </>
      )}

      {/* 2. Cuadrícula Configurable de Tarjetas de Formulario */}
      <div className={gridClasses}>
        {Array.from({ length: cardsCount }).map((_, cardIndex) => (
          <Card key={cardIndex} className="shadow-sm w-full">
            <CardHeader className="space-y-2">
              {/* Título y subtítulo de la tarjeta */}
              <Skeleton className="h-5 w-1/2 min-w-[120px]" />
              <Skeleton className="h-4 w-3/4 min-w-[160px]" />
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Filas de inputs configurables */}
              {Array.from({ length: rowsPerCard }).map((_, rowIndex) => (
                <div key={rowIndex} className="space-y-2">
                  {/* Label del input */}
                  <Skeleton className="h-3 w-14" />
                  {/* El campo/Input propiamente dicho */}
                  <Skeleton className="h-10 w-full" />
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
