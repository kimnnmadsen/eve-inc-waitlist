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
EditableGrid.prototype.initializeGrid = function() {
	this.setCellRenderer("account-name", new AccountCellRenderer());
};

$(document).ready(function() {
	var oldFilter = null;
	let getMetaData = waitlist.base.getMetaData;
	var canViewProfile = getMetaData('can-view-profile') === "True";
	var editableGrid = new EditableGrid(
		"CommandCore",
		{
			enableSort: true,
			pageSize: 10,
			maxBars: 5
		});

	editableGrid.load({
		metadata: [
			{
				name: "account-name",
				datatype: "string",
				editable: false,
				values: [{"value": "canViewProfile", "label": canViewProfile}]
			}, {
				name: "roles",
				datatype: "string",
				editable: false
			}, {
				name: "alts",
				datatype: "string",
				editable: false
			}
		]
	});

	editableGrid.attachToHTMLTable('commanderlist');
	editableGrid.initializePaginator();
	editableGrid.initializeGrid();
	editableGrid.renderGrid();
	$('#filter').on('keyup', function() {
		if (oldFilter != null) editableGrid.removeFilter(oldFilter);
		oldFilter = new StringFilter($('#filter').val());
		editableGrid.addFilter(oldFilter);
	});
	registerRoleFilterSelect(editableGrid, 'filterRole');
});
