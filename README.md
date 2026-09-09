# Plantilla Web Empresarial

Esta es una plantilla empresarial avanzada diseñada para proporcionar una base sólida y escalable sobre la cual construir aplicaciones modernas y robustas. Se enfoca en solucionar las necesidades comunes de cualquier software corporativo, incluyendo la gestión de usuarios, organizaciones/equipos, roles y permisos, auditoría de acciones, subida y gestión de documentos, y recuperación de datos.

---

## 🚀 Características Principales

*   **Gestión de Usuarios y Equipos:** Soporte para registro, inicio de sesión, perfiles de usuario, verificación de correo y organización en equipos/empresas.
*   **Roles y Permisos:** Control de acceso basado en roles (RBAC) para proteger componentes y rutas específicas (rutas de administrador, usuarios protegidos y rutas de invitados).
*   **Auditoría y Trazabilidad:** Registro estructurado de eventos y acciones del sistema.
*   **Gestión y Subida de Documentos:** Componentes integrados para arrastrar y soltar archivos (*Drag & Drop*) y subida de archivos listos para integrarse con servicios de almacenamiento.
*   **Recuperación de Datos:** Flujos completos para restablecimiento de contraseñas y recuperación de cuentas.
*   **Internacionalización (i18n):** Sistema multilenguaje integrado y configurado de manera nativa para soportar múltiples idiomas con traducción dinámica.

---

## 🛠️ Stack Tecnológico

El proyecto está construido sobre las siguientes tecnologías y librerías modernas:

### Core & Compilación
*   **React 19:** Biblioteca principal para la construcción de interfaces de usuario.
*   **TypeScript:** Tipado estático para garantizar la robustez del código.
*   **Vite 7:** Herramienta de compilación ultrarrápida y servidor de desarrollo.

### Estilos & UI
*   **Tailwind CSS v4:** Motor de estilos CSS utilitario moderno e hiperoptimizado.
*   **Radix UI / Vaul:** Primitivas de UI accesibles y sin estilos para diálogos, desplegables, avatares, etc.
*   **Material-UI (MUI Icons):** Pack de iconos vectoriales consistentes y profesionales.
*   **dnd-kit:** Herramientas modulares de arrastrar y soltar (*drag and drop*).

### Gestión de Estado & Datos
*   **TanStack React Query v5:** Gestión de estado asíncrono, sincronización y almacenamiento en caché de peticiones de servidor.
*   **Zustand:** Estado global ligero y reactivo para la gestión de estados del lado del cliente.
*   **Axios:** Cliente HTTP para la comunicación con las APIs del backend.

### Formularios & Validación
*   **React Hook Form:** Gestión eficiente de formularios con un rendimiento óptimo de renderizado.
*   **Zod:** Declaración de esquemas y validación de datos tanto en formularios como en respuestas de API.

### Seguridad & Autenticación
*   **Better Auth:** Cliente de autenticación moderno con soporte integrado para sesiones basadas en cookies, flujos de autenticación tradicionales, OAuth (Google) y hooks de React.

---

## ⚙️ Configuración y Caché de Sesión (`getSession`)

Para optimizar el rendimiento y evitar un volumen excesivo de llamadas a las APIs de autenticación de tu backend, el comportamiento de la sesión se gestiona a través de la configuración `sessionOptions` en [auth-client.ts](file:///c:/Users/javir/Desktop/APP/plantilla-web/src/config/auth-client.ts):

*   **`refetchOnWindowFocus: false` (Por defecto):** Se ha desactivado la recarga de sesión al enfocar o volver a la pestaña de la aplicación. Esto evita que si un usuario cambia constantemente de pestaña en su navegador, el servidor de API se sature con peticiones HTTP redundantes `/api/v1/auth/get-session`.

### ¿Cómo volver a activar la recarga de sesión al enfocar la pestaña?

Si tu aplicación requiere un nivel de seguridad crítico donde si el usuario cierra sesión en otra pestaña deba reflejarse inmediatamente en la actual, puedes volver a habilitar este comportamiento editando [auth-client.ts](file:///c:/Users/javir/Desktop/APP/plantilla-web/src/config/auth-client.ts):

```typescript
// src/config/auth-client.ts
export const authClient = createAuthClient({
  baseURL: `${backURL}/api/v1/auth`,
  fetchOptions: {
    credentials: 'include',
  },
  sessionOptions: {
    refetchOnWindowFocus: true, // Cambiar a true para revalidar al enfocar la pestaña
  },
});
```

---

## 🏁 Inicio Rápido

Sigue estos pasos para instalar y ejecutar el proyecto en tu entorno local.

### Prerrequisitos
Este proyecto utiliza **pnpm** como gestor de paquetes (recomendado debido al archivo de bloqueo `pnpm-lock.yaml`). Si no lo tienes instalado, puedes instalarlo globalmente con:
```bash
npm install -g pnpm
```

### 1. Clonar el repositorio e instalar dependencias
Instala los módulos necesarios ejecutando:
```bash
pnpm install
```

### 2. Configurar variables de entorno
Crea un archivo `.env` en la raíz del proyecto basado en el archivo `.env.example`:
```bash
cp .env.example .env
```
Configura la URL de tu API backend:
```env
VITE_BACK_URL=http://localhost:4000
```

### 3. Levantar el servidor de desarrollo
Inicia el proyecto de forma local:
```bash
pnpm dev
```
La aplicación estará disponible en [http://localhost:5173](http://localhost:5173).

### 4. Compilar para producción
Genera el bundle de producción optimizado:
```bash
pnpm build
```
Los archivos optimizados se guardarán en la carpeta `dist`.
