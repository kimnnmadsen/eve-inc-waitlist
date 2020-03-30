'use strict';

if (!waitlist) {
	var waitlist = {};
}

/**
 * wrapper for eve igb fuctions
 */
waitlist.IGBW = (function() {

	var urls = {
		openwindow: waitlist.base.getMetaData('api-igui-openwindow-ownerdetails'),
		newmail: waitlist.base.getMetaData('api-igui-openwindow-newmail'),
		esi_mail_send: waitlist.base.getMetaData('api-esi-mail-send'),
		esi_mail_auth: waitlist.base.getMetaData('api-esi-mail-auth')
	};

	/**
	 * Opens information window for the given item, oog it opens chruker.dk if only typeID is given
	 * @param typeID id for the type of the item id can be corporationID, allianceID, factionID, characterID, a celestial ID like regionID or solarSystemID 
	 */
	function showInfo(typeID, itemID) {
		if (typeof itemID === "undefined") {
			window.open("http://games.chruker.dk/eve_online/item.php?type_id="+typeID, "_blank");
		} else {
			$.post({
				'url': urls.openwindow,
				'data': {
					'characterID': itemID,
					'_csrf_token': waitlist.base.getMetaData('csrf-token')
				},
				'error': function(data) {
					var message = data.statusText;
					if (typeof data.responseText !== 'undefined') {
							message += ": " + data.responseText;
					}
					waitlist.base.displayMessage(message, "danger");
				}
			});
		}
	}

	/**
	 * Opens a mailwindow either igbapi or crest
	 * with the given topic, mail as body and charId as recipiant
	 * @param recipients = [{"recipient_id": ID, "recipient_type": "alliance|character|corporation|mailing_list"}]
	 * @param subject Mails Subject
	 * @param body Mails Body
	 */
	function sendMail(recipents, subject, body) {
		/*
		* mailRecipients => JSON String recipients=[{"recipient_id": ID, "recipient_type": "alliance|character|corporation|mailing_list"}]
		* mailBody => String
		* mailSubject => String
		 */
		$.post({
			'url': urls.esi_mail_send,
			'data': {
				'_csrf_token': waitlist.base.getMetaData('csrf-token'),
				'mailRecipients': JSON.stringify(recipents),
				'mailBody': body,
				'mailSubject': subject
			},
			'error': function(data) {
				var message = data.statusText;
				if (data.status === 412) {
					window.location = urls.esi_mail_auth;
				}
				if (typeof data.responseText !== 'undefined') {
						message += ": " + data.responseText;
				}
				waitlist.base.displayMessage(message, "danger");
			}
		});
	}

	return {
		sendMail: sendMail,
		showInfo: showInfo
	};
}());
/**
 * Account cell renderer
 * @constructor
 * @class Class to render a cell with Account names
 */
function AccountCellRenderer(config) { this.init(config); }
AccountCellRenderer.prototype = new CellRenderer();

AccountCellRenderer.prototype.render = function(element, value)
{
	if (this.column.optionValuesForRender["canViewProfile"] === true) {
		let link = document.createElement("a");
		link.setAttribute("href", `/accounts/profile/byname/${value}`);
		link.setAttribute("target", "_blank");
		link.textContent = value;
		element.appendChild(link);
	} else {
		element.textContent = value;
	}
};

AccountCellRenderer.prototype.getDisplayValue = function(rowIndex, value)
{
	return value;
};

/**
 * Alt Character cell renderer
 * @constructor
 * @class Class to render a cell with alt names
 */
function AltCellRenderer(config) { this.init(config); }
AltCellRenderer.prototype = new CellRenderer();

AltCellRenderer.prototype.render = function(element, value)
{

	let account_info = value.split(";");
	let account_id = Number(account_info[0]);
	let alts_list = new AltsList(account_id, this.column.optionValuesForRender["canChangeLinks"]);

	if (account_info[1].trim() !== "") {
		let alts_data = account_info[1].split(",");

		for(let alt_data_string of alts_data) {
			let alt_data = alt_data_string.split(':');
			if (alt_data.length != 2) {
				continue;
			}
			let character_name = alt_data[1];
			let character_id = alt_data[0];
			alts_list.addAltByData(character_id, character_name);
		}
	}
	element.appendChild(alts_list.element);
};

AltCellRenderer.prototype.getDisplayValue = function(rowIndex, value)
{
	let char_infos = value.split(";")[1].split(",");
	let char_names = [];
	for(let char_info of char_infos) {
		char_names.push(char_info.split(":")[1]);
	}
	return char_names.join(", ")
};
class RoleFilter extends Filter {
	constructor(roleName) {
		super();
		this.roleName = roleName;
	}
	
	shouldInclude(row, ridx, grid) {
		let roleIdx = grid.getColumnIndex('roles');
		let roleString = row.columns[roleIdx];
		let accId = row.id.substring(8);
		console.log("Account Id: "+accId+ " RIdx: "+ ridx);
		let value = grid.getValueAt(ridx, roleIdx);
		let roles = RoleFilter.rolesGridValueToList(value);
		console.log(roles);
		console.log("Role we want: " + this.roleName);
		let should_include = roles.includes(this.roleName);
		console.log("Should include " + should_include);
		return should_include;
	}
	
	static rolesGridValueToList(grid_value) {
		let roles_node = $.parseHTML('<div>'+grid_value+'</div>')[0];
		
		// remove the new node
		if (roles_node.children.length > 0 && roles_node.children[0].nodeName === "SPAN") {
			roles_node.children[0].remove()
		}
		let roles = roles_node.textContent;
		roles = roles.replace(/[\t\n\r]/g, ''); // clean up tabs and newlines
		roles = roles.split(', ');
		roles = roles.map(role => role.trim());
		return roles;
	}
}

/**
 * Actions Cell Renderer
 * @constructor
 * @class Class to render a cell action buttons
 */
function ActionCellRenderer(config) { this.init(config); }
ActionCellRenderer.prototype = new CellRenderer();

ActionCellRenderer.prototype.render = function(cell, value)
{

	let roles_column_name = this.column.optionValuesForRender["rolesColumnName"];
	
	// we don't know in what row we actually are
	let actions = new Actions(cell, value, roles_column_name, this.editablegrid, null);
	
	let account_id = actions.account_id;
	let disabled = actions.disabled;
	let had_welcome_mail = actions.had_mail;
	let target_char_id = actions.target_id;
	let sender_username = actions.sender_name;
	let target_username = actions.target_name;
	console.log('AccId: '+account_id+ " Disabled: "+disabled);
	let roles_column_idx = this.editablegrid.getColumnIndex(roles_column_name);

	let status_text_key = disabled ? 'wl-enable' : 'wl-disable';
	let status_button = $.parseHTML(`<button type="button" class="btn btn-sm btn-warning mr-1" data-type="${disabled ? "acc-enable" : "acc-disable" }" data-id="${ account_id }"></button>`)[0];
	status_button.textContent = $.i18n(status_text_key);
	let edit_button = $.parseHTML(`<button type="button" class="btn btn-sm btn-secondary mr-1" data-action="editAccount" data-accId="${account_id}"></button>`)[0];
	edit_button.textContent = $.i18n('wl-edit');
	
	cell.appendChild(status_button);
	cell.appendChild(edit_button);
	let roles_string = this.editablegrid.getValueAt(cell.rowIndex, roles_column_idx);
	let roles_list = RoleFilter.rolesGridValueToList(roles_string);
	
	let is_tbadge = roles_list.includes('tbadge');
	let is_rbadge = roles_list.includes('resident');
	if (!had_welcome_mail) {
		let user_type = is_tbadge ? 'tbadge' : is_rbadge ? 'resident' : 'other';
		let welcome_mail_button = $.parseHTML(`<button type="button" class="btn btn-sm btn-info" data-action="sendAuthMail" data-characterid="${target_char_id}" data-userType="${user_type}"></button>`)[0];
		welcome_mail_button.setAttribute('data-username', sender_username);
		welcome_mail_button.setAttribute('data-accusername', target_username);
		welcome_mail_button.textContent = $.i18n('wl-welcome-mail-button-text');
		
		cell.appendChild(welcome_mail_button);
	}
};

ActionCellRenderer.prototype.getDisplayValue = function(rowIndex, value)
{
	return value;
};

function registerRoleFilterSelect(editableGrid, selectId){
	let oldFilter = null;
	$('#'+selectId).on('change', function(event){
		let select = event.currentTarget;
		let val = select.value;
		if (oldFilter != null) editableGrid.removeFilter(oldFilter);
		if (val != '') {
			oldFilter = new RoleFilter(val);
			editableGrid.addFilter(oldFilter);
		} else {
			oldFilter = null;
		}
	});
}
class AccountRow {
	constructor(accountId, grid) {
		this.accountId = accountId;
		this.id = `account-${accountId}`;
		this.element = document.getElementById(this.id);
		this.grid = grid;
	}
	
	set status(value) {
		this.setColumn('status', value);
		let rowData = this.getThisRowData();
		if (value == $.i18n('wl-account-status-active') || value == $.i18n('wl-account-status-deactivated')) {
			let columnIdx = this.grid.getColumnIndex('actions');
			let actionsTd = this.grid.getCell(rowData.originalIndex, columnIdx);
			let rowIdx = this.grid.getRowIndex(this.id);
			let actionCell = new Actions(actionsTd, rowData.columns[columnIdx], 'roles', this.grid, rowIdx);
			actionCell.disabled = value == $.i18n('wl-account-status-deactivated');
			//Actions(this.grid.getCell())
		}
		this.grid.refreshGrid();
	}
	
	get name() {
		return this.getColumn('account-name');
	}
	
	get defaultCharName() {
		return this.getColumn('current-character');
	}
	
	get rolesIdx() {
		return this.getColumnIdx('roles');
	}
	
	getColumnIdx(name) {
		return this.grid.getColumnIndex(name);

	}
	
	getColumn(name) {
		let rowdata = this.getThisRowData();
		console.log("Get columnIdex for "+name);
		console.log(rowdata);
		console.log(this.grid);
		let columnIndex = this.grid.getColumnIndex(name);
		console.log('Got idx '+columnIndex+' for '+name);
		return rowdata.columns[columnIndex];
	}
	
	getThisRowData() {
		let data = this.grid.dataUnfiltered != null ? this.grid.dataUnfiltered : this.grid.data;
		// find the data row
		return data.find(e => e.id == this.id);
	}
	
	setColumn(name, value) {
		let griddata = this.grid.dataUnfiltered != null ? this.grid.dataUnfiltered : this.grid.data;
		// find the data row
		let rowdata = griddata.find(e => e.id == this.id);
		let columnIndex = this.grid.getColumnIndex(name);
		rowdata.columns[columnIndex] = value;
	}
}

class AltEntry {
	constructor(account_id, character_id, character_name, can_change_link) {
		if (account_id instanceof HTMLElement) {
			setDataFromHtml(account_id);
		} else {
			this.account_id = account_id;
			this.character_id = character_id;
			this.character_name = character_name;
			this.can_change_link = can_change_link;
			this.html = undefined;
			this.remove_button = undefined;
			this.alts_list = undefined;
		}
	}

	setDataDirect(account_id, character_id, character_name, can_change_link) {
		this.account_id = account_id;
		this.character_id = character_id;
		this.character_name = character_name;
		this.can_change_link = can_change_link;
	}

	setDataFromHtml(element) {
		if (!(element instanceof HTMLElement) || element.tagName !== 'SPAN') {
			throw new Error('Not a HTMLElement of tagName SPAN.');
		}

		this.html = element;
		let span_id = element.getAttribute('id');
		let span_id_parts = span_id.split('-');
		if (span_id_parts[0] !== 'altentry') {
			throw new Error("Given element is not an AltEntry");
		}
		let account_id = Number(span_id_parts[1]);
		let character_id = Number(span_id_parts[2]);
		let character_name = "";
		if (element.childNodes.length > 1) {
			this.can_change_link = true;
			character_name = element.childNodes[1].nodeValue;
		}
		else {
			this.can_change_link = false;
			character_name = element.childNodes[0].nodeValue;
		}
		this.account_id = account_id;
		this.character_name = character_name;
		this.character_id = character_id;
	}

	setAltsList(alts_list) {
		if (this.alts_list !== undefined) {
			this.alts_list.removeAltEntryByCharacterId(this.character_id);
		}
		this.alts_list = alts_list;
	}

	get element() {
		if (this.html === undefined) {
			this.html = this.createHtml();
		}
		return this.html;
	}

	remove_alt_button_handler(event) {
		let alt_entry = this;
		console.log(`Removing characterId=${this.character_id} from accountId=${this.account_id}`);
		waitlist.base.client.then(
			function(client) {
				client.apis.Accounts.delete_accounts_account_id({'account_id': alt_entry.account_id,
					'character_id': alt_entry.character_id,
					'requestInterceptor':
						function(req) {
						req.headers['X-CSRFToken'] = waitlist.base.getMetaData('csrf-token');
						return req;
					}
				}).then(
					function(event) {
						alt_entry.alts_list.removeAltEntryByCharacterId(alt_entry.character_id);
						waitlist.base.displayMessage("Alt removed", "success");
					}
				).catch(
					function(event) {
						waitlist.base.displayMessage(`Failed to remove alt: ${event.obj.error}`, "danger");
					}
				);
			}
		);
	}

	createHtml() {
		let alt_container = document.createElement('span');
		alt_container.setAttribute('id', `altentry-${this.account_id}-${this.character_id}`);
		alt_container.setAttribute('class', 'mr-2');
		if (this.can_change_link) {
			let remove_button = document.createElement('i');
			remove_button.setAttribute('class', 'fa fa-remove text-danger');
			remove_button.addEventListener('click', this.remove_alt_button_handler.bind(this));
			this.remove_button = remove_button;
			alt_container.appendChild(remove_button);
		}
		let nameNode = document.createTextNode(this.character_name);
		alt_container.appendChild(nameNode);
		return alt_container;
	}
}

class AltsList {
	constructor(account_id, can_change_link) {
		if (account_id instanceof HTMLElement){
			setDataFromHtml(account_id);
		} else {
			this.account_id = account_id;
			this.can_change_link = can_change_link;
			this.alt_entries = [];
			this.html = undefined;
			this.add_button = undefined;
		}
	}

	setDataFromHtml(element) {
		if (!(element instanceof HTMLElement) || element.tagName !== "DIV") {
			throw new Error("Not a HTMLElement of tagName DIV.");
		}
		let id_string = element.getAttribute('id');
		let id_parts = id_string.split('-');
		if (id_parts[0] !== "altslist") {
			throw new Error("Element is not an altslist");
		}

		this.html = element;

		this.account_id = Number(id_parts[1]);

		if (element.lastChild !== null &&
			element.lastChild.tagName == 'I' &&
			element.lastChild.getAttribute('data-action') == 'addAlt') {
			this.can_change_link = true;
			this.add_button = element.lastChild;
		} else {
			this.can_change_link = false;
		}

		for(let child of element.childNodes) {
			if (child.tagName === 'SPAN') {
				let alt_entry = new AltEntry(child);
				this.alt_entries.push(alt_entry);
			}
		}

	}

	setDataDirect(account_id, can_change_link, alt_entries) {
		this.account_id = account_id;
		this.can_change_link = can_change_link;
		if (alt_entries !== undefined) {
			for(let alt_entry of alt_entries) {
				addAltEntry(alt_entry);
			}
		}
	}

	addAltByData(character_id, character_name) {
		let alt_entry = new AltEntry(this.account_id, character_id, character_name, this.can_change_link);
		alt_entry.setAltsList(this);
		this.alt_entries.push(alt_entry);
		this.addAltEntryToElementIfNeeded(alt_entry);
	}

	addAltEntry(entry) {
		entry.setAltsList(this);
		this.alt_entries.push(entry);
		this.addAltEntryToElementIfNeeded(entry);
	}

	addAltEntryToElementIfNeeded(alt_entry) {
		if (this.html !== undefined) {
			if (this.can_change_link) {
				this.html.insertBefore(alt_entry.element, this.add_button)
			} else {
				this.html.appendChild(alt_entry.element);
			}
		}
	}

	removeAltEntryFromElementIfNeeded(alt_entry) {
		if (this.html !== undefined) {
			alt_entry.element.remove();
		}
	}

	removeAltEntryByCharacterId(character_id) {
		let alt_entry = this.getAltEntryByCharacterId(character_id);
		if (alt_entry !== null) {
			let alt_entry_idx = this.alt_entries.indexOf(alt_entry);
			this.alt_entries.splice(alt_entry_idx, 1);
			this.removeAltEntryFromElementIfNeeded(alt_entry);
		}
	}

	getAltEntryByCharacterId(character_id) {
		for(let alt_entry of this.alt_entries) {
			if (alt_entry.character_id === character_id) {
				return alt_entry;
			}
		}
		return null;
	}

	get element() {
		if (this.html === undefined) {
			this.html = this.createHtml();
		}
		return this.html;
	}

	add_button_handler(event) {
		let alts_list = this;
		waitlist.base.client.then(function(client){
			let account_id = alts_list.account_id;

			let input_field = document.createElement('input');
			input_field.setAttribute('type', 'text');
			input_field.setAttribute('class', 'form-control');
			input_field.setAttribute('placeholder', $.i18n('wl-add-alt-placehonder'));

			alts_list.element.appendChild(input_field);
			input_field = $(input_field);

			input_field.on('keyup', function(e) {
				if(e.keyCode == 13) { // enter
					let char_name = e.currentTarget.value;
					e.currentTarget.value = $.i18n('wl-please-wait');
					client.apis.Accounts.post_accounts_account_id({'account_id': account_id,
						'character_identifier': {'character_name': char_name}})
						.then(function(event) {
							waitlist.base.displayMessage($.i18n('wl-alt-added'), "success");
							input_field.remove();
							alts_list.addAltByData(event.obj.character_id, event.obj.character_name);
						})
						.catch(function(event) {
							if (typeof(event.response) !== "undefined" &&
								typeof(event.response.obj) !== "undefined" &&
								typeof(event.response.obj.error) !== "undefined"){
								waitlist.base.displayMessage($.i18n('wl-add-alt-failed', ' :' + event.response.obj.error), "danger");
							} else {
								waitlist.base.displayMessage($.i18n('wl-add-alt-failed', ''), "danger");
							}
							input_field.remove();
						});
				} else if (e.keyCode == 27) { // esc remove input
					input_field.remove();
				}
			});

		}).catch(function(event) {
			console.log("SwaggerError");
			console.log(event);
		});
	}

	remove_alt_button_handler(event) {

	}

	createHtml() {
		let alts_list = document.createElement('div');
		alts_list.setAttribute('id', 'altslist-'+this.account_id);

		for(let alt_entry of this.alt_entries) {
			alts_list.appendChild(alt_entry.element);
		}

		if (this.can_change_link) {
			this.add_button = document.createElement("i");
			this.add_button.setAttribute("class", "fa fa-plus-square text-success");
			this.add_button.setAttribute("data-account-id", this.account_id);
			this.add_button.setAttribute("data-action", "addAlt");
			this.add_button.addEventListener('click', this.add_button_handler.bind(this));
			alts_list.appendChild(this.add_button);
		}
		return alts_list;
	}

}

class Actions {
	constructor(table_data_node, text_value, roles_column_name, grid, rowIdx) {
		this.grid = grid;
		this.rowIdx = rowIdx;
		this.td = table_data_node;
		this.text = text_value;
		this.roles_name = roles_column_name;
		
		let account_info = this.text.split(':');
		this._acc_id = Number(account_info[0]);
		this._disabled = account_info[1].toLowerCase() == 'true';
		this._had_welcome_mail = account_info[2].toLowerCase() == 'true';
		this._target_id = Number(account_info[3]);
	}
	
	get account_id() {
		return this._acc_id;
	}
	
	get disabled() {
		return this._disabled;
	}
	
	set disabled(value) {
		this._disabled = value;
		this.update_text_value();
	}
	
	get had_mail() {
		return this._had_welcome_mail
	}
	
	get target_id() {
		return this._target_id;
	}
	
	get sender_name() {
		return this.td.getAttribute('data-sender');
	}
	
	get target_name() {
		return this.td.getAttribute('data-user');
	}
	
	update_text_value() {
		// if we don't know what row we are in we can't update data
		if (this.rowIdx == null) return;
		this.text = `${this._acc_id}:${this._disabled ? "True": "False" }:${this._had_welcome_mail ? "True": "False" }:${this._target_id}`;
		console.log(this.text);
		this.grid.setValueAt(this.rowIdx, this.grid.getColumnIndex('actions'), this.text);
	}

}
'use strict';

if (!waitlist) {
	var waitlist = {};
}


waitlist.accounts = (function() {
	var getMetaData = waitlist.base.getMetaData;
	var displayMessage = waitlist.base.displayMessage;
	
	var sendMail = waitlist.IGBW.sendMail;
	
	let grid = null;

	function disableAccount(accountId, onsuccess){
		var settings = {
				async: true,
				dataType: "text",
				error: function() {
					displayMessage($.i18n('wl-accounts-error-disable-account-failed'), "danger");
				},
				method: "POST",
				data: {
					id: accountId,
					disabled: true
				},
				success: onsuccess,
				headers: {
					'X-CSRFToken': getMetaData('csrf-token')
				}
		};
		$.ajax(getMetaData('api-account-disable'), settings);
	}

	function enableAccount(accountId, onsuccess){
		var settings = {
				async: true,
				dataType: "text",
				error: function() {
					displayMessage($.i18n('wl-accounts-error-enabling-account-failed'), "danger");
				},
				method: "POST",
				data: {
					id: accountId,
					disabled: false
				},
				success: onsuccess,
				headers: {
					'X-CSRFToken': getMetaData('csrf-token')
				}
		};
		$.ajax(getMetaData('api-account-disable'), settings);
	}

	function enableAccountHandler(event) {
		var source = $(event.currentTarget);
		var id = Number(source.data('id'));
		enableAccount(id, function() {
			let accountRow = new AccountRow(id, grid);
			accountRow.status = $.i18n('wl-account-status-active');
		});
	}
	
	function disableAccountHandler(event) {
		var source = $(event.currentTarget);
		var id = Number(source.data('id'));
		disableAccount(id, function() {
			let accountRow = new AccountRow(id, grid);
			accountRow.status = $.i18n('wl-account-status-deactivated');
		});
	}
	
	function editAccountHandler(event) {
		var target = $(event.currentTarget);
		var accId = target.attr('data-accId');
		editAccount(accId);
	}
	
	function sendAuthMailHandler(event) {
		var target = $(event.currentTarget);
		var charId = Number(target.attr('data-characterid'));
		var token = target.attr('data-token');
		var senderUsername = target.attr('data-username');
		var targetUsername = target.attr('data-accusername');
		var targetUserType = target.attr('data-userType');
		sendAuthMail(charId, token, senderUsername, targetUsername, targetUserType);
		var charTr = target.closest('tr');
		var accId = parseInt(charTr.attr('id').substring('account-'.length));
		var needsMailTag = $(`#acc-${accId}-needsmail`, charTr);
		needsMailTag.remove();
	}

	function setUpEventhandlers() {
		var accountTable = $('#account-table-body');
		accountTable.on('click', '[data-type="acc-enable"]', enableAccountHandler);
		accountTable.on('click', '[data-type="acc-disable"]', disableAccountHandler);
		accountTable.on('click', '[data-action="editAccount"]', editAccountHandler);
		accountTable.on('click', '[data-action="sendAuthMail"]', sendAuthMailHandler);
	}

	function editAccount(accountId) {
		let account_node = document.getElementById(`account-${accountId}`);
		let account_row = new AccountRow(accountId, grid);
		let name = account_row.name;		
		
		let roles_node = account_node.children[account_row.rolesIdx];
		let has_new_tag = (roles_node.children.length > 0 && roles_node.children[0].nodeName === "SPAN");
		let roles = roles_node.textContent;
		roles = roles.replace(/[\t\n\r]/g, ''); // clean up tabs and newlines
		// if it has a new tag remove the "New" from the beginning
		if (has_new_tag){
			roles = roles.slice(3)
		}
		
		let default_char_name = account_row.defaultCharName;
		$('#acc-edit-name').val(name);
		// this is more complicated
		// $('#acc-edit-roles')
		roles = roles.split(", ");
		roles = roles.map(x => x.trim())
		// map the roles he has to a dict so we can fast and easy check for them
		// later
		let has_roles = {};
		for (let idx in roles) {
			has_roles[roles[idx]] = true;
		}

		let edit_roles_select = document.getElementById('acc-edit-roles');
		for (let i=0; i < edit_roles_select.options.length; i++) {
			let option = edit_roles_select.options[i];
			let val = option.value;
			if (val in has_roles) {
				option.selected = true;
			} else {
				option.selected = false;
			}
		}
		$('#acc-edit-cchar').val(default_char_name);
		$('#acc-edit-id').val(accountId);
		$('#modal-account-edit').modal('toggle');
	}

	function noclick() {
		$('.noclick').click(function(e){
			e.preventDefault();
		});
	}

	function sendAuthMail(charId, token, sig, username, type) {
		var link_prefix = window.location.protocol + '//' + window.location.host;
		var link = link_prefix+'/tokenauth?token='+token;
		var mail = "";
		var topic = "";
		switch(type){
		case "resident":
		case "tbadge":
			mail = getMetaData(`mail-${type}-body`);
			topic =  getMetaData(`mail-${type}-topic`);
			break;
		default:
			mail = getMetaData('mail-other-body');
			topic = getMetaData('mail-other-topic');
		}
		mail = mail.replace("$recv$", username).replace("$link$", link).replace("$sig$", sig);
		topic = topic.replace("$recv$", username).replace("$link$", link).replace("$sig$", sig);
		//
		// [{"recipient_id": ID, "recipient_type": "alliance|character|corporation|mailing_list"}]
		sendMail([{"recipient_id": charId, "recipient_type": "character"}], topic, mail);
	}
	
	function setUpTable() {
		grid = new EditableGrid(
			"Accounts",
			{
				enableSort: true,
				pageSize: 10,
				maxBars: 5
			},
			$.parseHTML('<i class="fa fa-arrow-down" aria-hidden="true"></i>')[0],
			$.parseHTML('<i class="fa fa-arrow-up" aria-hidden="true"></i>')[0]);

		grid.load({
			metadata: [
				{
					name: 'actions',
					datatype: "string",
					editable: false,
					values: [{"value": "rolesColumnName", "label": "roles"}]
				}, {
					name: 'status',
					datatype: "string",
					editable: false
				}, {
					name: 'account-name',
					datatype: "string",
					editable: false,
					values: [{"value": "canViewProfile", "label": true}]
				}, {
					name: 'roles',
					datatype: "html",
					editable: false
				}, {
					name: 'current-character',
					datatype: "string",
					editable: false
				}, {
					name: 'alts',
					datatype: "string",
					editable: false,
					values: [{"value": "canChangeLinks", "label": getMetaData('can-change-links') == 'True'}]
				}, {
					name: "#",
					datatype: "integer",
					editable: false
				}
			]
		});

		grid.attachToHTMLTable('acctable');
		grid.initializePaginator();
		grid.initializeGrid();
		grid.renderGrid();
		let oldFilter = null;
		$('#filter').on('keyup', function() {
			if (oldFilter != null) grid.removeFilter(oldFilter);
			oldFilter = new StringFilter($('#filter').val());
			grid.addFilter(oldFilter);
		});
		registerRoleFilterSelect(grid, 'filterRole');
	}
	
	function init() {
		noclick();
		setUpEventhandlers();
		setUpTable();
	}

	$(document).ready(init);
	return {};
})();

EditableGrid.prototype.initializeGrid = function() {
	this.setCellRenderer('account-name', new AccountCellRenderer());
	this.setCellRenderer('alts', new AltCellRenderer());
	this.setCellRenderer('actions', new ActionCellRenderer());
};