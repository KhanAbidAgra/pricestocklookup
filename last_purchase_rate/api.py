import json
import frappe


@frappe.whitelist()
def get_item_sales_history(item_code=None, item_codes=None, limit=20):
	"""Get item sales history with last purchase rates. Accepts single item_code or a list via item_codes."""
	if not frappe.has_permission("Sales Invoice", "read"):
		frappe.throw("Not permitted", frappe.PermissionError)

	limit = int(limit or 20)
	where = ["si.docstatus = 1"]
	params = {"limit": limit}

	codes = _resolve_item_codes(item_code, item_codes)
	if codes:
		where.append("sii.item_code IN %(item_codes)s")
		params["item_codes"] = codes

	where_sql = " AND ".join(where)

	rows = frappe.db.sql(
		f"""
		SELECT
			si.posting_date,
			si.name           AS sales_invoice,
			si.customer,
			si.company,
			sii.item_code,
			sii.item_name,
			sii.qty,
			sii.uom,
			sii.rate          AS sales_rate,
			sii.amount        AS sales_amount,
			si.currency,
			(
				SELECT pii.rate
				FROM `tabPurchase Invoice Item` pii
				JOIN `tabPurchase Invoice` pi ON pi.name = pii.parent
				WHERE pi.docstatus = 1
				  AND pii.item_code = sii.item_code
				ORDER BY pi.posting_date DESC, pi.name DESC
				LIMIT 1
			) AS last_purchase_rate
		FROM `tabSales Invoice Item` sii
		JOIN `tabSales Invoice` si ON si.name = sii.parent
		WHERE {where_sql}
		ORDER BY si.posting_date DESC, si.name DESC, sii.idx ASC
		LIMIT %(limit)s
		""",
		params,
		as_dict=True,
	)

	return rows


@frappe.whitelist()
def get_item_purchase_history(item_code=None, item_codes=None, limit=20):
	"""Get item purchase history from submitted Purchase Invoices."""
	if not frappe.has_permission("Purchase Invoice", "read"):
		frappe.throw("Not permitted", frappe.PermissionError)

	limit = int(limit or 20)
	where = ["pi.docstatus = 1"]
	params = {"limit": limit}

	codes = _resolve_item_codes(item_code, item_codes)
	if codes:
		where.append("pii.item_code IN %(item_codes)s")
		params["item_codes"] = codes

	where_sql = " AND ".join(where)

	rows = frappe.db.sql(
		f"""
		SELECT
			pi.posting_date,
			pi.name       AS purchase_invoice,
			pi.supplier,
			pi.company,
			pii.item_code,
			pii.item_name,
			pii.qty,
			pii.uom,
			pii.rate      AS purchase_rate,
			pii.amount    AS purchase_amount,
			pi.currency
		FROM `tabPurchase Invoice Item` pii
		JOIN `tabPurchase Invoice` pi ON pi.name = pii.parent
		WHERE {where_sql}
		ORDER BY pi.posting_date DESC, pi.name DESC, pii.idx ASC
		LIMIT %(limit)s
		""",
		params,
		as_dict=True,
	)

	return rows


def _resolve_item_codes(item_code, item_codes):
	"""Return a tuple of item codes from either a single string or a JSON list."""
	if item_codes:
		if isinstance(item_codes, str):
			item_codes = json.loads(item_codes)
		return tuple(item_codes)
	if item_code:
		return (item_code,)
	return None
