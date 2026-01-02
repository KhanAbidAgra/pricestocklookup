import frappe

@frappe.whitelist()
def get_item_warehouse_qty(item_code):
    if not item_code:
        return {}

    # 1️⃣ Fetch active selling price lists
    price_lists = frappe.get_all(
        "Price List",
        filters={
            "enabled": 1,
            "selling": 1
        },
        fields=["name"]
    )

    price_list_names = [pl.name for pl in price_lists]

    # 2️⃣ Fetch item details
    item = frappe.db.get_value(
        "Item",
        item_code,
        ["item_name", "description"],
        as_dict=True
    )

    # 3️⃣ Fetch warehouse stock
    bins = frappe.get_all(
        "Bin",
        filters={"item_code": item_code},
        fields=["warehouse", "actual_qty"]
    )

    # 4️⃣ Fetch all Item Prices in ONE query
    prices = frappe.get_all(
        "Item Price",
        filters={
            "item_code": item_code,
            "price_list": ["in", price_list_names]
        },
        fields=["price_list", "price_list_rate"]
    )

    price_map = {p.price_list: p.price_list_rate for p in prices}

    # 5️⃣ Build rows
    rows = []
    for b in bins:
        row = {
            "item_code": item_code,
            "description": item.description,
            "warehouse": b.warehouse,
            "qty": b.actual_qty,
            "prices": price_map
        }
        rows.append(row)

    return {
        "price_lists": price_list_names,
        "rows": rows
    }
