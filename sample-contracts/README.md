# Sample contracts (for testing AI extraction)

Synthetic, single-page PDF contracts used to exercise the **Add Contract →
Extract from PDF (AI)** flow. Each file is one contract of a different type so
uploading all five covers every dedicated parameter form:

| File | Contract type | Notable parameters |
| --- | --- | --- |
| `01-day-ahead-spot.pdf` | Day-Ahead Spot Contract | BE - Spot, constant 12.50 €/MWh, scaling 1, Consumption / Buy, category Cost |
| `02-fixed-hedge.pdf` | Fixed Hedge | Power hedge, kW, 55.00 €/MWh, Consumption |
| `03-fixed-cost.pdf` | Fixed Cost | 1,000.00 €/year |
| `04-energy-tax.pdf` | Energy Tax | 1.00 €/MWh, Consumption |
| `05-ppa.pdf` | Physical Power Purchase Agreement (PPA) | pay as produced, onsite, 45.00 €/MWh, Solar Panels, scaling 1 |
| `06-bundle-spot-and-tax.pdf` | **Two contracts in one PDF** | A Day-Ahead Spot Contract **and** an Energy Tax — tests multi-contract extraction |

A single PDF can contain multiple contracts: the extractor segments the document
and returns one draft per contract (`06-bundle-spot-and-tax.pdf` yields two).

These are fictional; names/suppliers are made up. Requires `ANTHROPIC_API_KEY`
(with account credits) — see the project README.
