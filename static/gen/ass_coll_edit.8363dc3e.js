'use strict';
if (!waitlist) {
	var waitlist = {};
}
if (!waitlist.ship_assignment) {
	waitlist.ship_assignment = {};
}

waitlist.ship_assignment.collection = (function () {

	function updateListSelect(group_select, waitlist_selector) {
	  // "#default_target_id"
		const wl_select = $(waitlist_selector);
		let enabled_options = wl_select.find("option:not([disabled])");
		enabled_options.prop("hidden", true);
		enabled_options.prop("disabled", true);
		let options_for_selection = wl_select.find("option[data-group=\"" + group_select.val() + "\"]");
		options_for_selection.prop("disabled", false);
		options_for_selection.prop("hidden", false);
		// now select one of the enabled options
		let option = wl_select.find("option:not([disabled])").first();
		option.prop("selected", true);
	}

  function addSubwaitlistPopulationHandler(group_selector, waitlist_selector) {
    // "#wl_group_id_select"
    $(group_selector).on("change", function(event){ updateListSelect($(event.target), waitlist_selector); });
  }
  
  function doInitialSubwaitlistPopulation(group_selector, waitlist_selector) {
  		const group_select = $(group_selector);
			updateListSelect(group_select, waitlist_selector);
  }

  return {'addSubwaitlistPopulationHandler': addSubwaitlistPopulationHandler, 'doInitialSubwaitlistPopulation': doInitialSubwaitlistPopulation};
})();

'use strict';
if (!waitlist) {
	var waitlist = {};
}
if (!waitlist.ship_assignment) {
	waitlist.ship_assignment = {};
}

waitlist.ship_assignment.collection_edit = (function () {

	let addSubwaitlistPopulationHandler = waitlist.ship_assignment.collection.addSubwaitlistPopulationHandler;

	function init() {
	addSubwaitlistPopulationHandler("#wl_group_id_select", "#default_target_id");
	$("#check_type").on("change", typeSelectHandler);
	}

	function typeSelectHandler(event) {
		let type = parseInt($(event.target).val(), 10);
		if (isNaN(type)) return;
		if (type > 3) {
			$("#check_add_modifier, #check_add_rest_type_ids, #check_add_rest_invgroup_ids, #check_add_rest_mgroup_ids").parent().prop("hidden", false);
		} else {
			$("#check_add_modifier, #check_add_rest_type_ids, #check_add_rest_invgroup_ids, #check_add_rest_mgroup_ids").parent().prop("hidden", true);
		}
	}

	$(document).ready(init);
})();
