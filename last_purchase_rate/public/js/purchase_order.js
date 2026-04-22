frappe.ui.form.on('Purchase Order', {
	refresh: function (frm) {
		lpr_inject_styles();
		setTimeout(() => lpr_add_buttons(frm, 'purchase'), 1000);
	},
	items_add: function (frm) {
		setTimeout(() => lpr_add_buttons(frm, 'purchase'), 500);
	}
});

function lpr_inject_styles() {
	if (document.getElementById('lpr-styles')) return;
	const s = document.createElement('style');
	s.id = 'lpr-styles';
	s.textContent = `
		.lpr-table-wrap{max-height:260px;overflow-y:auto;border-radius:6px;border:1px solid var(--border-color,#d1d8dd);margin-bottom:6px}
		.lpr-table{width:100%;border-collapse:collapse;font-size:12.5px}
		.lpr-table thead th{position:sticky;top:0;z-index:1;background:var(--fg-color,#f8f9fa);padding:7px 10px;font-weight:600;border-bottom:2px solid var(--border-color,#d1d8dd);white-space:nowrap;cursor:pointer;user-select:none}
		.lpr-table thead th:hover{background:var(--control-bg,#eef0f2)}
		.lpr-table thead th .lpr-sort-icon{margin-left:4px;opacity:.45;font-size:10px}
		.lpr-table thead th.lpr-sort-asc .lpr-sort-icon::after{content:"▲"}
		.lpr-table thead th.lpr-sort-desc .lpr-sort-icon::after{content:"▼"}
		.lpr-table thead th:not(.lpr-sort-asc):not(.lpr-sort-desc) .lpr-sort-icon::after{content:"⇅"}
		.lpr-table tbody tr:nth-child(even){background:var(--control-bg,#fafbfc)}
		.lpr-table tbody tr:hover{background:#eef4ff}
		.lpr-table td{padding:5px 10px;border-bottom:1px solid var(--border-color,#e8ecef);vertical-align:middle}
		.lpr-table td.lpr-rate{background:#e8f4fd;font-weight:600}
		.lpr-table td.lpr-sales-rate{background:#e8f8e8;font-weight:600}
		.lpr-table td.lpr-num{text-align:right}
		.lpr-table td.lpr-muted{color:var(--text-muted,#8d99a6);font-size:11.5px}
		.lpr-filter-row th{background:var(--fg-color,#f8f9fa)!important;padding:4px 6px!important;cursor:default}
		.lpr-filter-row input{width:100%;padding:3px 6px;border:1px solid var(--border-color,#ccc);border-radius:4px;font-size:11px;outline:none}
		.lpr-filter-row input:focus{border-color:var(--primary,#5e64ff)}
		.lpr-link{color:var(--primary,#5e64ff);cursor:pointer;text-decoration:none;font-weight:500}
		.lpr-link:hover{text-decoration:underline}
		.lpr-section-header{display:flex;align-items:center;gap:8px;margin:8px 0 4px;cursor:pointer;user-select:none}
		.lpr-section-title{font-weight:700;font-size:11px;color:var(--text-muted,#8d99a6);text-transform:uppercase;letter-spacing:.6px}
		.lpr-collapse-icon{font-size:10px;color:var(--text-muted,#8d99a6);transition:transform .2s}
		.lpr-section-collapsed .lpr-collapse-icon{transform:rotate(-90deg)}
		.lpr-tab-bar{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:14px;padding-bottom:10px;border-bottom:1px solid var(--border-color,#d1d8dd)}
		.lpr-tab{padding:5px 14px;border-radius:20px;border:1px solid var(--border-color,#d1d8dd);cursor:pointer;font-size:12px;background:var(--control-bg,#f4f5f7);transition:all .15s;user-select:none}
		.lpr-tab:hover{background:#e8eeff;border-color:var(--primary,#5e64ff)}
		.lpr-tab.lpr-active{background:var(--primary,#5e64ff);color:#fff;border-color:var(--primary,#5e64ff);font-weight:600}
		.lpr-tab-pane{display:none}
		.lpr-tab-pane.lpr-active{display:block}
		.lpr-empty{color:var(--text-muted,#8d99a6);font-size:13px;padding:16px 0;text-align:center}
		.lpr-loading{color:var(--text-muted,#8d99a6);font-size:13px;padding:16px 0;text-align:center}
	`;
	document.head.appendChild(s);
}

function lpr_add_buttons(frm, mode) {
	if (frm._lpr_btns_added) return;
	let $sec = frm.$wrapper.find('[data-fieldname="items"]');
	if (!$sec.length) return;
	let $row = $('<div class="lpr-btn-row" style="display:flex;gap:8px;padding:6px 0 2px"></div>');
	let $histBtn = $(`<button class="btn btn-default btn-sm">${__('Price History')}</button>`);
	$histBtn.on('click', () => lpr_open_history_dialog(frm, mode));
	$row.append($histBtn);
	$sec.append($row);
	frm._lpr_btns_added = true;
}

function lpr_open_history_dialog(frm, mode) {
	const unique_items = [...new Set((frm.doc.items || []).map(r => r.item_code).filter(Boolean))];
	if (!unique_items.length) { frappe.msgprint(__('No items in the table.')); return; }

	let d = new frappe.ui.Dialog({
		title: __('Price History'),
		fields: [{ fieldname: 'body', fieldtype: 'HTML' }],
		size: 'extra-large',
		primary_action_label: __('Close'),
		primary_action: () => d.hide()
	});
	d.$wrapper.find('.modal-dialog').css({ 'max-width': '75%', width: '75%' });
	d.show();

	let tabs_html = '<div class="lpr-tab-bar">';
	unique_items.forEach((code, i) => {
		tabs_html += `<div class="lpr-tab${i === 0 ? ' lpr-active' : ''}" data-item="${frappe.utils.escape_html(code)}">${frappe.utils.escape_html(code)}</div>`;
	});
	tabs_html += '</div><div class="lpr-tab-content">';
	unique_items.forEach((code, i) => {
		tabs_html += `<div class="lpr-tab-pane${i === 0 ? ' lpr-active' : ''}" data-pane="${frappe.utils.escape_html(code)}"><div class="lpr-loading">${__('Loading…')}</div></div>`;
	});
	tabs_html += '</div>';
	d.fields_dict.body.$wrapper.html(tabs_html);

	d.fields_dict.body.$wrapper.find('.lpr-tab').on('click', function () {
		const code = $(this).data('item');
		d.fields_dict.body.$wrapper.find('.lpr-tab').removeClass('lpr-active');
		d.fields_dict.body.$wrapper.find('.lpr-tab-pane').removeClass('lpr-active');
		$(this).addClass('lpr-active');
		let $pane = d.fields_dict.body.$wrapper.find(`.lpr-tab-pane[data-pane="${CSS.escape(code)}"]`);
		$pane.addClass('lpr-active');
		if ($pane.data('loaded')) return;
		$pane.data('loaded', true);
		lpr_fetch_and_render(code, $pane, mode);
	});

	let $first = d.fields_dict.body.$wrapper.find('.lpr-tab-pane').first();
	$first.data('loaded', true);
	lpr_fetch_and_render(unique_items[0], $first, mode);
}

function lpr_fetch_and_render(item_code, $pane, mode) {
	$pane.html(`<div class="lpr-loading">${__('Loading…')}</div>`);
	let sales_done = false, purchase_done = false, sales_rows = [], purchase_rows = [];

	function maybe_render() {
		if (!sales_done || !purchase_done) return;
		let html = mode === 'sales'
			? lpr_render_section('sales', sales_rows) + lpr_render_section('purchase', purchase_rows)
			: lpr_render_section('purchase', purchase_rows) + lpr_render_section('sales', sales_rows);
		$pane.html(html);
		lpr_bind_links($pane);
		lpr_bind_filters($pane);
		lpr_bind_sort($pane);
		lpr_bind_collapse($pane);
	}

	frappe.call({
		method: 'last_purchase_rate.api.get_item_sales_history',
		args: { item_code, limit: 30 },
		callback: r => { sales_rows = r.message || []; sales_done = true; maybe_render(); }
	});
	frappe.call({
		method: 'last_purchase_rate.api.get_item_purchase_history',
		args: { item_code, limit: 30 },
		callback: r => { purchase_rows = r.message || []; purchase_done = true; maybe_render(); }
	});
}

function lpr_render_section(type, rows) {
	const is_sales = type === 'sales';
	const title = is_sales ? __('Sales History') : __('Purchase History');
	const empty_msg = is_sales ? __('No sales history found.') : __('No purchase history found.');
	const cols = is_sales
		? [__('Date'), __('Sales Invoice'), __('Customer'), __('Item Name'), __('Qty'), __('UOM'), __('Sales Rate')]
		: [__('Date'), __('Purchase Invoice'), __('Supplier'), __('Item Name'), __('Qty'), __('UOM'), __('Purchase Rate')];
	const filter_placeholders = is_sales
		? [__('Date'), __('Invoice'), __('Customer'), __('Item Name'), __('Qty'), __('UOM'), __('Rate')]
		: [__('Date'), __('Invoice'), __('Supplier'), __('Item Name'), __('Qty'), __('UOM'), __('Rate')];

	let html = `<div class="lpr-section" data-section="${type}">
		<div class="lpr-section-header">
			<span class="lpr-section-title">${title}</span>
			<span class="lpr-collapse-icon">▼</span>
		</div>
		<div class="lpr-section-body">`;

	if (!rows.length) {
		html += `<div class="lpr-empty">${empty_msg}</div>`;
	} else {
		html += `<div class="lpr-table-wrap"><table class="lpr-table"><thead><tr>`;
		cols.forEach((c, i) => {
			html += `<th data-col="${i}"><span>${c}</span><span class="lpr-sort-icon"></span></th>`;
		});
		html += `</tr><tr class="lpr-filter-row">`;
		filter_placeholders.forEach(p => { html += `<th><input placeholder="${p}"></th>`; });
		html += `</tr></thead><tbody>`;
		rows.forEach(r => {
			if (is_sales) {
				html += `<tr>
					<td class="lpr-muted">${frappe.utils.escape_html(r.posting_date || '')}</td>
					<td><a class="lpr-link" data-doctype="Sales Invoice" data-name="${frappe.utils.escape_html(r.sales_invoice || '')}">${frappe.utils.escape_html(r.sales_invoice || '')}</a></td>
					<td>${frappe.utils.escape_html(r.customer || '')}</td>
					<td>${frappe.utils.escape_html(r.item_name || '')}</td>
					<td class="lpr-num">${format_number(r.qty || 0, null)}</td>
					<td class="lpr-muted">${frappe.utils.escape_html(r.uom || '')}</td>
					<td class="lpr-num lpr-sales-rate">${format_currency(r.sales_rate || 0, r.currency || '')}</td>
				</tr>`;
			} else {
				html += `<tr>
					<td class="lpr-muted">${frappe.utils.escape_html(r.posting_date || '')}</td>
					<td><a class="lpr-link" data-doctype="Purchase Invoice" data-name="${frappe.utils.escape_html(r.purchase_invoice || '')}">${frappe.utils.escape_html(r.purchase_invoice || '')}</a></td>
					<td>${frappe.utils.escape_html(r.supplier || '')}</td>
					<td>${frappe.utils.escape_html(r.item_name || '')}</td>
					<td class="lpr-num">${format_number(r.qty || 0, null)}</td>
					<td class="lpr-muted">${frappe.utils.escape_html(r.uom || '')}</td>
					<td class="lpr-num lpr-rate">${format_currency(r.purchase_rate || 0, r.currency || '')}</td>
				</tr>`;
			}
		});
		html += `</tbody></table></div>`;
	}
	html += `</div></div>`;
	return html;
}

function lpr_bind_collapse($pane) {
	$pane.find('.lpr-section-header').on('click', function () {
		const $section = $(this).closest('.lpr-section');
		const $body = $section.find('.lpr-section-body');
		const collapsed = $section.hasClass('lpr-section-collapsed');
		if (collapsed) {
			$body.show();
			$section.removeClass('lpr-section-collapsed');
		} else {
			$body.hide();
			$section.addClass('lpr-section-collapsed');
		}
	});
}

function lpr_bind_sort($pane) {
	$pane.find('.lpr-table').each(function () {
		const $tbl = $(this);
		$tbl.find('thead tr:first-child th').on('click', function () {
			const $th = $(this);
			const ci = $th.index();
			const asc = !$th.hasClass('lpr-sort-asc');
			$tbl.find('thead tr:first-child th').removeClass('lpr-sort-asc lpr-sort-desc');
			$th.addClass(asc ? 'lpr-sort-asc' : 'lpr-sort-desc');
			const $tbody = $tbl.find('tbody');
			const rows = $tbody.find('tr').toArray();
			rows.sort((a, b) => {
				const ta = (a.cells[ci] ? a.cells[ci].textContent : '').trim();
				const tb = (b.cells[ci] ? b.cells[ci].textContent : '').trim();
				const na = parseFloat(ta.replace(/[^0-9.\-]/g, ''));
				const nb = parseFloat(tb.replace(/[^0-9.\-]/g, ''));
				if (!isNaN(na) && !isNaN(nb)) return asc ? na - nb : nb - na;
				return asc ? ta.localeCompare(tb) : tb.localeCompare(ta);
			});
			rows.forEach(r => $tbody.append(r));
		});
	});
}

function lpr_bind_links($pane) {
	$pane.find('.lpr-link[data-doctype][data-name]').off('click').on('click', function () {
		frappe.set_route('Form', this.getAttribute('data-doctype'), this.getAttribute('data-name'));
	});
}

function lpr_bind_filters($pane) {
	$pane.find('.lpr-table').each(function () {
		const tbl = this;
		$(tbl).find('.lpr-filter-row input').each(function (ci) {
			$(this).off('input').on('input', function () {
				const val = this.value.toLowerCase().trim();
				$(tbl).find('tbody tr').each(function () {
					const cell = this.cells[ci];
					const text = cell ? (cell.textContent || '').toLowerCase() : '';
					this.style.display = (!val || text.includes(val)) ? '' : 'none';
				});
			});
		});
	});
}
