# 🤖 agent.md — Guía Operativa de La Jodita

Documento de referencia rápida para cualquier agente IA o colaborador técnico.

---

## 🎯 Objetivo

Mantener y evolucionar La Jodita sin romper:

- flujo de 4 pasos
- persistencia local existente
- estilo visual actual
- compatibilidad de sesiones compartidas

---

## 🧱 Alcance técnico

- App de archivo único en src/pages/index.astro
- Toda la UI y lógica vive en HTML + CSS global + JS inline
- API de sesiones en src/pages/api/s
- Redis para snapshots compartidos con expiración

---

## ✨ Funcionalidades clave

- Participantes con avatar y color determinista
- Carga de gastos con 3 modos de división
- Liquidación automática por balances
- Historial local de hasta 10 sesiones
- Compartido por link solo para sesiones creadas por el usuario
- Redondeo visual global sin decimales
- Badge de versión visible en header

---

## 🧩 Patrones de implementación

- Secuencia obligatoria: mutar state -> save() -> render()
- Evitar duplicar lógica de formateo de montos
- Reutilizar helpers: roundAmount, formatAmount, formatMoney
- Mantener IDs y classes de UI consistentes
- Priorizar cambios pequeños y localizados

---

## 🎨 Patrones de estilos

- Mantener paleta y lenguaje visual actual
- No quitar style is:global
- Mantener responsive mobile
- No introducir librerías de estilos externas

---

## 🔖 Versionado

Constante actual en frontend:

- APP_VERSION = { major, minor, patch, majorUpdates, minorUpdates }

Criterio:

- major: cambios grandes de flujo/estructura
- minor: nuevas capacidades sin ruptura
- patch: fixes y ajustes menores

---

## 🤝 Forma de trabajo

1. Leer la sección afectada completa antes de editar.
2. Hacer cambios mínimos que cumplan el requerimiento.
3. Compilar con npm run build.
4. Si hay cambios funcionales, actualizar README.md, CLAUDE.md y este archivo.
5. No cambiar claves de localStorage ya publicadas.

---

## 🧪 Validación mínima

- npm run build sin errores
- recorrido manual de pasos 1 a 4
- prueba de compartir/cargar sesión
- verificación de historial y badge de versión
