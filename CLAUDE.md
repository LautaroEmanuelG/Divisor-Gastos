# 🎯 CLAUDE.md — La Jodita

Guía operativa para agentes IA y colaboradores técnicos del proyecto.

---

## 🧱 Arquitectura

La app es una SPA estática de archivo único:

```text
src/pages/index.astro
```

- HTML: estructura de los 4 pasos
- style is:global: estilos globales (requerido por componentes dinámicos con innerHTML)
- script is:inline: estado, lógica y renderizado

No introducir componentes Astro separados ni frameworks de UI sin pedido explícito.

---

## 🧠 Estado y persistencia

```js
// localStorage
KEY = 'divisor-v2'                 // estado principal
HISTORY_KEY = 'divisor-history-v1' // historial de sesiones
USER_KEY = 'divisor-user-v1'       // identificador local de usuario

state = {
  tripName: string,
  participants: string[],
  baseCurrency: string,
  extraCurrencies: [{ code, rate }],
  expenses: [{
    id,
    description,
    paidBy,
    currency,
    amount,
    amountInBase,
    splits,
    emoji
  }]
}
```

Regla crítica: siempre ejecutar save() después de mutar state.

---

## 🚀 Funcionalidades

- Carga de participantes con avatar/color determinista
- Gastos multi-moneda con conversión a moneda base
- Liquidación automática por compensación greedy
- Historial local de sesiones (máximo 10)
- Compartir sesiones vía API + Redis (TTL)
- Restricción de compartido: solo creador puede re-compartir
- Redondeo visual global sin decimales
- Versión visible en header con conteo de cambios mayores/menores

---

## 🧩 Patrones de código

- Flujo render-first: mutar estado, save(), render de sección afectada
- Helpers de formato centralizados: roundAmount, formatAmount, formatMoney
- Variables globales de UI controladas por prefijo \_ (ejemplo: \_liquidacion)
- IDs en DOM con naming semántico (history-count, btn-compartir)
- Cálculos monetarios internos en centavos para liquidación

---

## 🎨 Estilos y UX

- Mantener diseño actual: tarjetas suaves, acento violeta, tipografía limpia
- En mobile, la tabla de balance muestra solo avatar en columna Persona
- Evitar cambios de tema drásticos sin aprobación
- Mantener animaciones ligeras y consistentes (fade/slide/pop)
- No quitar style is:global

---

## 🔖 Versionado de producto

Se usa versionado semántico visible en header:

```text
APP_VERSION = { major, minor, patch, majorUpdates, minorUpdates }
```

Reglas sugeridas:

- major: cambios de UX/arquitectura que alteran flujos clave
- minor: nuevas funcionalidades compatibles
- patch: correcciones sin cambio funcional relevante

Actualizar APP_VERSION y su badge al cerrar cada release.

---

## 🤝 Forma de trabajo

1. Leer el bloque afectado completo antes de editar.
2. Aplicar cambios puntuales en index.astro (sin refactors amplios no pedidos).
3. Validar con npm run build.
4. Si se toca documentación, actualizar README.md + CLAUDE.md + agent.md.
5. No romper compatibilidad de localStorage keys existentes.

---

## 🛠️ Comandos

```bash
npm run dev
npm run build
npm run preview
```

---

## 🚫 No hacer

- No cambiar KEY = 'divisor-v2'
- No quitar style is:global ni script is:inline
- No agregar backend adicional fuera de las APIs ya existentes
- No introducir dependencias de UI sin aprobación
