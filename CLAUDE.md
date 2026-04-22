# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What This App Does

`last_purchase_rate` is a Frappe/ERPNext app that enhances Sales Invoice, Delivery Note, and Sales Order forms with two UI dialogs:
- **Show Price History** — sales history with the last purchase rate per item
- **Stock Balance** — current warehouse quantities and selling prices per item

## Development Commands

All commands run from the bench root (`~/v16/frappe-bench`), not the app directory.

```bash
# Run tests
bench --site <site-name> run-tests --app last_purchase_rate

# Install app on a site
bench --site <site-name> install-app last_purchase_rate

# Reload fixtures (custom fields, property setters)
bench --site <site-name> import-fixtures --app last_purchase_rate

# Build frontend assets
bench build --app last_purchase_rate
```

## Linting

```bash
cd apps/last_purchase_rate

# First-time setup
pre-commit install

# Run all linters manually
pre-commit run --all-files

# Run ruff only
ruff check .
ruff format .
```

Linting config: **ruff** for Python (line length 110, double quotes, tab indent), **eslint** + **prettier** for JavaScript.

## Architecture

### How It Works

`hooks.py` maps three DocTypes to their respective JS files. When a user opens a Sales Invoice (or Delivery Note, Sales Order), Frappe automatically loads the corresponding JS file, which:

1. Registers a `refresh` event handler via `frappe.ui.form.on()`
2. Adds two buttons to the form toolbar
3. Each button opens a `frappe.ui.Dialog` that calls a whitelisted Python API

### Python API (`last_purchase_rate/api.py`)

Two `@frappe.whitelist()` functions called from the client:

- **`get_item_sales_history(item_code, limit=20)`** — joins `tabSales Invoice Item`, `tabSales Invoice`, and `tabPurchase Invoice Item` to return sales history with last purchase rates. Requires "Sales Invoice" read permission.
- **`get_item_warehouse_qty(item_code)`** — fetches stock bin quantities per warehouse and all enabled selling price lists with their rates for the item. Defined in `last_purchase_rate/last_purchase_rate/api/sales_invoice_dialog_button.py` and re-exported from `api.py`.

### Frontend (`public/js/`)

Three nearly identical files (`sales_invoice.js`, `deliver_note.js`, `sales_order.js`) — each registers the same two dialogs for its respective DocType. The dialogs include client-side filtering (case-insensitive substring match across all visible rows).

### Fixtures (`fixtures/`)

`property_setter.json` contains 11 property setters for Sales Invoice fields (controlling visibility of `rounded_total`, `tax_id`, `scan_barcode`, etc.). Managed via `hooks.py` fixtures list.

### Module Layout

```
last_purchase_rate/
├── hooks.py                          # App config: doctype_js, fixtures
├── api.py                            # Whitelisted API entry point
├── last_purchase_rate/api/
│   └── sales_invoice_dialog_button.py  # get_item_warehouse_qty logic
├── public/js/
│   ├── sales_invoice.js
│   ├── deliver_note.js
│   └── sales_order.js
│   └── quotation.js
│   └── purchase_order.js
│   └── purchase_invoice.js
│   └── supplier_quotation.js
└── fixtures/
    └── property_setter.json
```
