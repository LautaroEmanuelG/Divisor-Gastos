# CLAUDE.md — Divisor de Gastos

Instrucciones para agentes IA que trabajen en este proyecto.

---

## Arquitectura

Una SPA estática de un solo archivo. Toda la app vive en:

```text
src/pages/index.astro
```

- **HTML** — estructura de los 4 pasos (stepper)
- **`<style is:global>`** — todo el CSS (global obligatorio por elementos dinámicos con innerHTML)
- **`<script is:inline>`** — toda la lógica JS

No hay componentes separados, APIs, ni base de datos.

---

## Estado de la aplicación

```js
// Clave en localStorage: 'divisor-v2'
state = {
  tripName:        string,
  participants:    string[],
  baseCurrency:    string,           // 'ARS' por defecto
  extraCurrencies: { code, rate }[], // 1 baseCurrency = rate extraCurrency
  expenses: [{
    id,
    description,
    paidBy,
    currency,
    amount,       // en la moneda del gasto
    amountInBase, // convertido a baseCurrency
    splits: {     // { [persona]: monto en moneda del gasto }
      [persona]: number
    },
    emoji
  }]
}
```

Siempre llamar `save()` después de mutar `state`.

---

## Funciones clave

```text
goToStep(n)           Navega entre pasos 1-4, actualiza stepper visual
addParticipant()      Lee input, agrega a state.participants, renderiza chips
addExpense()          Valida monto+pagador, calcula splits, push a state.expenses
calcularLiquidacion() Corre el algoritmo de compensación, renderiza resultados
renderChips()         Renderiza tags de participantes con color por persona
renderPayerGrid()     Renderiza botones de pagador (usando colorFor)
renderExpensesList()  Renderiza tarjetas de gastos con botón de edición inline
toggleEdit(id)        Abre/cierra el panel de edición de un gasto
saveExpenseEdit(id)   Aplica cambios de pagador y división al gasto
colorFor(name)        Genera color determinista por nombre (hash → COLORS[])
initials(name)        Retorna 1-2 letras iniciales del nombre
```

---

## Algoritmo de liquidación

```text
1. pagos[persona]    = Σ amountInBase de gastos que pagó
2. consumos[persona] = Σ splits[persona] × convFactor por gasto
3. balance           = pagos − consumos
4. deudores          = personas con balance < 0 (deben plata)
5. acreedores        = personas con balance > 0 (les deben)
6. greedy loop       = min(deuda, crédito) por par hasta saldar todo
```

Tolerancia: si `|totalPagado − totalConsumido| > 1.00` (en moneda base) se muestra error.

---

## Reglas críticas del CSS

> **IMPORTANTE:** El `<style>` DEBE tener `is:global`.

Sin `is:global`, Astro scopea los selectores con atributos `data-astro-cid-xxx`.
Los elementos generados dinámicamente vía `innerHTML` no tienen esos atributos,
por lo que el CSS de clase no les aplica (solo los inline `style=""`).

```astro
<!-- ✅ Correcto -->
<style is:global>
  .transfer-body { display: flex; }
</style>

<!-- ❌ Roto — elementos dinámicos no reciben el scope -->
<style>
  .transfer-body { display: flex; }
</style>
```

---

## Agregar monedas adicionales

La tasa se define como: `1 baseCurrency = rate extraCurrency`

```js
// Ejemplo: base ARS, agregar USD
// Si 1 ARS = 0.00068 USD → rate = 0.00068
state.extraCurrencies.push({ code: 'USD', rate: 0.00068 })

// Conversión de gasto en USD a ARS:
amountInBase = amount / rate  // divido porque rate = ARS→USD
```

---

## Comandos

```bash
npm run dev      # http://localhost:4321
npm run build    # output en /dist
npm run preview  # sirve /dist
```

---

## Qué NO hacer

- No extraer componentes Astro separados sin que el usuario lo pida
- No agregar frameworks de UI (React, Vue, etc.)
- No agregar backend ni base de datos
- No cambiar la clave `divisor-v2` de localStorage (rompe datos existentes)
- No quitar `is:global` ni `is:inline` de los tags de style/script
