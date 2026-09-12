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
before the demo.

| Where | English | Español |
|---|---|---|
| Language toggle | English | Español |
| Store name field | Store name | Nombre de la tienda |
| Store code field | Store code | Código de la tienda |
| Scan button | Scan an invoice | Escanear una factura |
| Photo button | Take a photo | Tomar una foto |
| Loading | Reading your invoice… | Leyendo su factura… |
| Scan date | Scanned {date} | Escaneado el {date} |
| Overall pass | Passes the USDA stocking rule | Cumple con el requisito de surtido del USDA |
| Overall fail | Not passing today | Hoy no cumple |
| Category chip | Pass / Fail | Cumple / No cumple |
| Category varieties | {n} of 7 varieties | {n} de 7 variedades |
| Category units | {n} of 21 units | {n} de 21 unidades |
| Total units | {n} of 84 units | {n} de 84 unidades |
| Perishables | Perishables in {n} of 4 categories | Productos perecederos en {n} de 4 categorías |
| Category has a perishable | Has a perishable item | Tiene un producto perecedero |
| Category has none | No perishable item yet | Todavía sin producto perecedero |
| Fix list heading | Fix it before inspection | Corríjalo antes de la inspección |
| Not-counted heading | Couldn't read these, so they don't count | No pudimos leer estas líneas, así que no cuentan |
| Not-counted row | Not counted | No se contó |
| Accessory food | Accessory food, doesn't count | Alimento accesorio, no cuenta |
| Scan error | Something went wrong. Try the photo again. | Algo salió mal. Intente con la foto otra vez. |
| The rule | 7 varieties in each of 4 categories, 3 units each, 84 units total, perishables in 3 of 4 | 7 variedades en cada una de las 4 categorías, 3 unidades de cada una, 84 unidades en total y productos perecederos en 3 de las 4 |
| Compliance date | Compliance date: November 4, 2026 | Fecha de cumplimiento: 4 de noviembre de 2026 |
| Consequence | A store that fails is withdrawn from SNAP and can't reapply for six months. | Una tienda que no cumple queda fuera de SNAP y no puede volver a solicitarlo durante seis meses. |
