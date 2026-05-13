# Commander Victory Events

## Slice

- Replaced the hardcoded commander-victory simulation event that always said `Gate Inquisitor` and `crypt gate`.
- Added commander and district-aware victory event text for palace, wall, canal, market, chapel, and crypt commander objectives.
- Added pure reducer coverage proving a defeated Dawn Exarch emits palace-gate-specific victory text.

## Verification

- `npm run build`
- `npm run test:e2e -- --grep "commander victory event"`
- `npm run test:e2e`

## Proof

The focused test forces the `palace-gate` Dawn Exarch down through battle state, resolves the reducer with `endPlayerTurn`, and verifies:

```json
{"result":"victory","latestEvent":"Dawn Exarch is broken. The palace gate loses its sunlit command."}
```
