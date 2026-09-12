# Spanish strings

For Role A (Framer). Owned by Role C. A draft: tell C when the screen copy
changes and C will update this table.

## Already in Spanish: `scorecardEs`

`POST /api/scan` returns `scorecardEs` next to `scorecard`. It has the same
numbers, items and fix order, with Spanish category labels, `itemSuggestion`
and `whyItHelps`. Show one or the other depending on the language toggle; no
second scan needed.

```ts
const card = lang === "es" ? data.scorecardEs : data.scorecard;
```

The English and Spanish text lives in
[`lib/scorecard-copy.ts`](../lib/scorecard-copy.ts).

## Stays English in both languages

- **Item names and varieties** (`items[].name`, `items[].variety`, and top-up
  fixes such as "Select Cucumber bushel (surta 1 más)"). They're printed on the
  invoice or named by the classifier.
- **`excluded[].reason`**. Some reasons are written by the model. In Spanish
  mode show "No se contó" instead.
- **`error.message`**. In Spanish mode show the generic error below.

## Screen labels

Formal *usted*, Mexican-American Spanish for Los Angeles stores. `{n}` and
`{date}` are placeholders. Have a native speaker on the team read these once
before the demo. Regulatory wording follows
[the SNAP stocking regulatory basis](regulatory-basis.md); keep the disclaimer
visible beside every result.

| Where | English | Español |
|---|---|---|
| Language toggle | English | Español |
| Store name field | Store name | Nombre de la tienda |
| Scan button | Scan an invoice | Escanear una factura |
| Photo button | Take a photo | Tomar una foto |
| Loading | Reading your invoice… | Leyendo su factura… |
| Scan date | Scanned {date} | Escaneado el {date} |
| Overall pass | Estimated to meet the SNAP stocking standard | La estimación indica que cumple con el requisito de surtido de SNAP |
| Overall fail | May not meet the stocking standard yet | Es posible que aún no cumpla con el requisito de surtido |
| Category chip | At threshold / Below threshold | Al nivel requerido / Debajo del nivel requerido |
| Category varieties | {n} of 7 varieties | {n} de 7 variedades |
| Category units | {n} of 21 units | {n} de 21 unidades |
| Total units | {n} of 84 units | {n} de 84 unidades |
| Perishables | Perishables in {n} of 4 categories | Productos perecederos en {n} de 4 categorías |
| Category has a perishable | Has a perishable item | Tiene un producto perecedero |
| Category has none | No perishable item yet | Todavía sin producto perecedero |
| Fix list heading | What to stock next | Qué surtir a continuación |
| Not-counted heading | Couldn't read these, so they don't count | No pudimos leer estas líneas, así que no cuentan |
| Not-counted row | Not counted | No se contó |
| Accessory food | Accessory food, doesn't count | Alimento accesorio, no cuenta |
| Scan error | Something went wrong. Try the photo again. | Algo salió mal. Intente con la foto otra vez. |
| The rule | Criterion A estimate: 7 varieties in each of 4 categories, 3 units of each variety, 84 units total, and a perishable variety in 3 of 4 categories | Estimación del Criterio A: 7 variedades en cada una de las 4 categorías, 3 unidades de cada variedad, 84 unidades en total y una variedad perecedera en 3 de las 4 categorías |
| Compliance date | Updated standard applies beginning November 4, 2026 | El requisito actualizado aplica a partir del 4 de noviembre de 2026 |
| Result disclaimer | Readiness estimate only. Ledger checks items it can read in this image against the Criterion A stocking thresholds. It is not an official USDA eligibility determination. | Esta es solo una estimación de preparación. Ledger compara los artículos que puede leer en esta imagen con los requisitos de surtido del Criterio A. No es una determinación oficial de elegibilidad del USDA. |
| Consequence | If USDA determines that a store does not meet the new requirements, USDA says it will deny the application or withdraw the authorized store. The store may reapply six months after the denial or withdrawal. Ledger does not make that determination. | Si el USDA determina que una tienda no cumple con los nuevos requisitos, rechazará la solicitud o retirará de SNAP a la tienda autorizada. La tienda puede volver a solicitar autorización seis meses después del rechazo o retiro. Ledger no toma esa decisión. |
