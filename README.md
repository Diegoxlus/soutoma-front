# soutoma-front

Frontend Angular para una plataforma web responsive de visualización y gestión de cuadros de pádel.

## Estado actual

Fase 1 iniciada: base del proyecto y arquitectura Angular preparada. El proyecto contiene la configuración inicial de Angular, TypeScript strict, SCSS, Angular Material y la estructura de carpetas prevista para evolucionar el MVP por dominios funcionales.

## Stack base

- Angular con Standalone Components.
- TypeScript strict.
- Angular Router.
- HttpClient.
- Angular Material.
- SCSS mobile-first.

## Scripts previstos

```bash
npm install
npm start
npm run build
npm run test
npm run lint
```

> Nota: las dependencias deben instalarse antes de ejecutar los scripts Angular.

## Estructura preparada

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

## Configuración de API

Los environments iniciales definen:

- Local: `http://localhost:3000/api`
- Producción: `https://YOUR_API_URL/api`

## Prompt técnico para Codex

El prompt estructurado para diseñar e implementar el MVP frontend Angular está disponible en:

- [`docs/codex-padel-platform-prompt.md`](docs/codex-padel-platform-prompt.md)
