# Prompt técnico para Codex: Frontend Angular para plataforma de cuadros de pádel

Actúa como arquitecto senior frontend especializado en Angular moderno.

Implementa el frontend de una plataforma web responsive para visualizar y gestionar cuadros de pádel. Prioriza un MVP funcional, mantenible y preparado para integrarse con una API REST.

## Stack obligatorio

Usa:

* Angular última versión estable.
* TypeScript strict.
* Standalone Components.
* Angular Router.
* HttpClient.
* Reactive Forms.
* Signals cuando aporten valor real.
* Lazy loading por dominios funcionales.
* Angular Material.
* SCSS mobile-first.
* Arquitectura limpia y escalable.

Justifica brevemente Angular Material frente a PrimeNG por simplicidad, integración oficial con Angular, accesibilidad y rapidez para MVP.

## Alcance frontend MVP

La aplicación debe incluir:

* Parte pública sin autenticación.
* Panel privado de administración.
* Login único de administrador.
* JWT persistido en sessionStorage.
* Interceptor HTTP para añadir Authorization: Bearer <token>.
* Auth guard para rutas privadas.
* Integración real con API REST.
* Diseño responsive usable en móvil, tablet y escritorio.

## API base

Configura environments:

```ts
export const environment = {
  production: false,
  apiBaseUrl: 'http://localhost:3000/api',
};
```

Producción:

```ts
export const environment = {
  production: true,
  apiBaseUrl: 'https://YOUR_API_URL/api',
};
```

## Endpoints que debe consumir

### Auth

```http
POST /api/auth/login
```

### Públicos

```http
GET /api/public/brackets
GET /api/public/brackets/:id
GET /api/public/sponsors
```

### Admin protegidos

```http
GET    /api/admin/brackets
POST   /api/admin/brackets
PUT    /api/admin/brackets/:id
DELETE /api/admin/brackets/:id
GET    /api/admin/brackets/:id/matches
PUT    /api/admin/matches/:id
GET    /api/admin/sponsors
POST   /api/admin/sponsors
PUT    /api/admin/sponsors/:id
DELETE /api/admin/sponsors/:id
```

## Modelos TypeScript

Crea modelos tipados:

```ts
export interface Player {
  id: string;
  name: string;
}
export interface Pair {
  id: string;
  player1: Player;
  player2: Player;
}
export interface Match {
  id: string;
  bracketId: string;
  round: number;
  position: number;
  pairA?: Pair | null;
  pairB?: Pair | null;
  isBye: boolean;
  result?: string | null;
  winner?: Pair | null;
  scheduledAt?: string | null;
}
export interface Bracket {
  id: string;
  name: string;
  description?: string | null;
  registeredPairs: number;
  order: number;
  visible: boolean;
  createdAt: string;
  updatedAt: string;
  matches?: Match[];
}
export interface Sponsor {
  id: string;
  name: string;
  imageBase64?: string | null;
  imageUrl?: string | null;
  order: number;
  visible: boolean;
}
export interface LoginRequest {
  username: string;
  password: string;
}
export interface LoginResponse {
  accessToken: string;
  expiresIn: number;
  user: {
    id: string;
    username: string;
    role: 'ADMIN';
  };
}
```

## Estructura Angular esperada

Usa esta estructura:

```text
src/app/
  core/
    guards/
    interceptors/
    layout/
    config/
  shared/
    components/
    pipes/
    utils/
  public/
    pages/
    components/
  admin/
    pages/
    components/
    forms/
  auth/
    pages/
    services/
  models/
  services/
```

## Rutas obligatorias

Configura:

```text
/
/brackets
/admin/login
/admin
/admin/brackets
/admin/brackets/:id
/admin/sponsors
```

Reglas:

* /, /brackets son públicas.
* /admin/login es pública.
* /admin, /admin/brackets, /admin/brackets/:id, /admin/sponsors están protegidas.
* Si el usuario ya está autenticado y entra en /admin/login, redirige a /admin.

Usa lazy loading cuando aplique.

## Servicios Angular

Implementa servicios tipados:

### AuthService

Debe incluir:

```ts
login(request: LoginRequest): Observable<LoginResponse>
logout(): void
token(): string | null
isAuthenticated(): boolean
```

Persistencia:

* Guardar JWT en sessionStorage.
* Limpiar sesión en logout.
* Redirigir al login tras logout.

### PublicBracketService

Debe incluir:

```ts
getVisibleBrackets(): Observable<Bracket[]>
getBracketById(id: string): Observable<Bracket>
```

### AdminBracketService

Debe incluir:

```ts
getBrackets(): Observable<Bracket[]>
getBracket(id: string): Observable<Bracket>
createBracket(payload: Partial<Bracket>): Observable<Bracket>
updateBracket(id: string, payload: Partial<Bracket>): Observable<Bracket>
deleteBracket(id: string): Observable<void>
getMatches(bracketId: string): Observable<Match[]>
updateMatch(id: string, payload: Partial<Match>): Observable<Match>
```

### SponsorService

Debe incluir:

```ts
getVisibleSponsors(): Observable<Sponsor[]>
getSponsors(): Observable<Sponsor[]>
createSponsor(payload: Partial<Sponsor>): Observable<Sponsor>
updateSponsor(id: string, payload: Partial<Sponsor>): Observable<Sponsor>
deleteSponsor(id: string): Observable<void>
```

## Seguridad frontend

Implementa:

* AuthGuard.
* LoginRedirectGuard o lógica equivalente para evitar login si ya hay sesión.
* AuthInterceptor.
* Manejo de error 401:
  * limpiar sesión.
  * redirigir a /admin/login.
* No guardar información sensible innecesaria.
* No hardcodear tokens.

## Componentes públicos

### PublicShellComponent

Layout responsive con:

* Header público.
* Drawer o menú lateral.
* Área de contenido principal.

### BracketDrawerComponent

Debe:

* Mostrar cuadros visibles ordenados.
* Permitir seleccionar cuadro.
* Ser usable en móvil.
* Mostrar estado vacío si no hay cuadros.

### PublicHomeComponent

Debe:

* Cargar sponsors visibles.
* Mostrar SponsorsGridComponent cuando no hay cuadro seleccionado.
* Permitir navegación a cuadros.

### BracketViewerComponent

Debe:

* Recibir o cargar un bracket.
* Agrupar matches por ronda.
* Renderizar rondas horizontalmente.
* En móvil permitir scroll horizontal.

### BracketRoundComponent

Debe:

* Mostrar título de ronda.
* Mostrar lista de partidos de la ronda.

### MatchCardComponent

Debe mostrar:

* Pareja A.
* Pareja B.
* Jugadores de cada pareja.
* Estado BYE.
* Resultado.
* Fecha y hora programada.
* Ganador destacado visualmente sin depender solo del color.

### SponsorsGridComponent

Debe:

* Mostrar sponsors visibles.
* Soportar imageBase64 e imageUrl.
* Ordenar visualmente según order.
* Mostrar placeholder si no hay imagen.

## Componentes auth

### AdminLoginComponent

Debe:

* Usar formulario reactivo.
* Validar usuario requerido.
* Validar contraseña requerida.
* Mostrar errores accesibles.
* Mostrar feedback si login falla.
* Deshabilitar botón mientras carga.
* Redirigir a /admin si login correcto.

## Componentes admin

### AdminShellComponent

Layout privado con:

* Sidebar o menú.
* Header.
* Botón logout.
* Router outlet.

### AdminDashboardComponent

Debe mostrar accesos rápidos a:

* Gestión de cuadros.
* Gestión de patrocinadores.

### AdminBracketsListComponent

Debe:

* Listar cuadros.
* Mostrar nombre, orden, visible, número de parejas y fecha.
* Crear nuevo cuadro.
* Editar cuadro.
* Eliminar cuadro con confirmación.
* Acceder al editor de enfrentamientos.

### AdminBracketEditComponent

Debe:

* Crear y editar cuadro.
* Formulario reactivo con:
  * name
  * description
  * registeredPairs
  * order
  * visible
* Validaciones:
  * name requerido.
  * registeredPairs entre 2 y 64.
  * order numérico.
* Al crear un cuadro, informar que el backend generará los enfrentamientos automáticamente.
* Si se está editando, mostrar también AdminMatchesEditorComponent.

### AdminMatchesEditorComponent

Debe:

* Cargar matches del bracket.
* Agrupar por ronda.
* Permitir editar cada match.
* Editar:
  * pairA.player1.name
  * pairA.player2.name
  * pairB.player1.name
  * pairB.player2.name
  * isBye
  * result
  * winner
  * scheduledAt
* Guardar cambios llamando a PUT /api/admin/matches/:id.
* Mostrar estados de carga y error.

### AdminSponsorsListComponent

Debe:

* Listar sponsors.
* Crear sponsor.
* Editar sponsor.
* Eliminar sponsor con confirmación.
* Formulario con:
  * name
  * imageBase64
  * imageUrl
  * order
  * visible
* Validar name requerido.
* Permitir usar base64 o URL.
* Mostrar preview de imagen cuando sea posible.

## Diseño responsive

Aplica:

* Mobile-first.
* Breakpoints para móvil, tablet y desktop.
* Bracket con scroll horizontal en pantallas pequeñas.
* Cards claras y legibles.
* Formularios cómodos en móvil.
* Botones con tamaño táctil adecuado.
* Header y drawer adaptables.

## Accesibilidad

Aplica:

* HTML semántico.
* Labels en inputs.
* aria-label cuando sea necesario.
* Mensajes de error asociados a campos.
* Focus visible.
* Contraste suficiente.
* No depender exclusivamente del color para identificar ganador.

## Estado y UX mínima

Implementa:

* Estados de carga.
* Estados de error.
* Estados vacíos.
* Confirmación antes de eliminar.
* Feedback tras guardar.
* Manejo básico de errores HTTP.
* Evita duplicación de llamadas HTTP innecesarias.

No implementes todavía:

* Skeleton loaders avanzados.
* Animaciones complejas.
* Theming avanzado.
* Dashboard con métricas.
* Caché HTTP avanzada.
* Lazy rendering avanzado.

## Build y calidad

Configura y verifica:

```bash
npm install
npm run lint
npm run test
npm run build
```

Usa TypeScript strict y evita any salvo casos muy justificados.

## Despliegue frontend

Documenta despliegue en:

* Cloudflare Pages.
* Vercel.
* Netlify.

Incluye:

* Comando de build.
* Carpeta de salida.
* Configuración de apiBaseUrl.
* Notas sobre CORS con backend.
* Variables necesarias si aplica.

## README frontend

Incluye documentación con:

1. Stack usado.
2. Estructura de carpetas.
3. Instalación.
4. Ejecución local.
5. Configuración de environments.
6. Rutas disponibles.
7. Integración con API REST.
8. Build de producción.
9. Despliegue.
10. Backlog Fase 2.

## Backlog Fase 2

Documenta, pero no implementes:

* Animaciones avanzadas del bracket.
* Skeleton loaders.
* Theming avanzado.
* Gestión avanzada de torneos.
* Categorías.
* Fase de grupos.
* Consolación.
* Subida real de imágenes a storage cloud.
* Dashboard con métricas.
* CI/CD.
* Monitorización frontend.

## Formato final de respuesta de Codex

Al terminar, responde con:

1. Resumen de arquitectura frontend.
2. Stack elegido y justificación.
3. Archivos principales creados o modificados.
4. Rutas implementadas.
5. Servicios implementados.
6. Componentes implementados.
7. Instrucciones de instalación.
8. Instrucciones de ejecución local.
9. Configuración de environments.
10. Integración con API.
11. Tests/checks ejecutados y resultado.
12. Build ejecutado y resultado.
13. Estrategia de despliegue.
14. Backlog Fase 2.
15. Limitaciones conocidas si las hubiera.

## Criterios de aceptación

La entrega será válida si:

* El frontend compila.
* Existen rutas públicas y privadas.
* El login admin funciona contra la API.
* El JWT se guarda en sessionStorage.
* El interceptor añade el token.
* Las rutas privadas están protegidas.
* El logout limpia sesión.
* Se consumen endpoints públicos.
* Se consumen endpoints admin.
* Se visualizan cuadros visibles ordenados.
* Se visualiza un bracket responsive.
* Se muestran patrocinadores si no hay cuadro seleccionado.
* El admin puede gestionar cuadros.
* El admin puede editar enfrentamientos.
* El admin puede gestionar sponsors.
* Hay estados de carga, error y vacío.
* El diseño es responsive y usable.
* Existe README con ejecución y despliegue.
