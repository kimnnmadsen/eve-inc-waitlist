'use strict';

if (!waitlist) {
	var waitlist = {};
}

waitlist.ts3 = (function() {
	var getMetaData = waitlist.base.getMetaData;
	function testPoke() {
		$.get(getMetaData('api-ts-test'));
	}
	function init() {
		// setup fit button handler related to linemembers
		$("body").on('click', '[data-action="test-poke"]', testPoke);
	}

	$(document).ready(init);
	return {};
})();

'use strict';

if (!waitlist) {
	var waitlist = {};
}

waitlist.gong = (function() {

	const getMetaData = waitlist.base.getMetaData;
	const displayMessage = waitlist.base.displayMessage;
	const addListener = waitlist.sse.addEventListener;
	const storage = localStorage;
	const gongVersion = "1";
	var gongbutton, sound, gongLoaded, gongAlert, gongURL;

	function playGong() {
		if (gongbutton.checked) {
			sound.currentTime = 0;
			sound.play();
		}
	}

	function gongClicked() {
		if (gongbutton.checked) {
			if (gongLoaded !== true) {
				checkGongCache();
			}
			if (gongAlert === "y") {
				removeGongAlert();
			}
			sound.removeAttribute("hidden");
			storage.gong = "open";
		} else {
			sound.setAttribute("hidden", "");
			sound.pause();
			sound.currentTime = 0;
			storage.removeItem("gong");
		}
	}

	function removeGongAlert() {
		$("#gong-alert").remove();
	}

	function disableGong() {
		gongbutton.checked = false;
		gongClicked();
		removeGongAlert();
		document.getElementById("gong").remove();
	}

	function gongSetup() {
		// Setup SSE invite-send event
		addListener("invite-send", playGong);
		gongbutton.addEventListener("click", gongClicked);
		sound.volume = 0.5;
		// Checks storage for gong info if not found alert to please enable notification
		if (storage.gong) {
			gongbutton.checked = true;
			gongClicked();
		} else {
			displayMessage($.i18n('wl-gong-info'), "info", false, "gong-alert");
			gongAlert = "y";
		}
	}
	
	function setGongSrc() {
		gongLoaded = true;
		var gongBlob = storage.gongFile;
		sound.setAttribute("src", gongBlob);
	}

	function getGong() {
		fetch(gongURL).then(function(response) {
			response.blob().then(function(blob) {
				var reader = new FileReader();
					reader.addEventListener("loadend", function() {
						storage.gongFile = reader.result.toString();
						storage.gongVersion = gongVersion;
						setGongSrc();
					});
				reader.readAsDataURL(blob);
			});
		});
	}

	function checkGongCache() {
		if (storage.gongVersion !== gongVersion || storage.gongFile === undefined) {
			getGong();
		} else {
			setGongSrc();
		}
	}

	function init() {
		gongbutton = document.getElementById("gongbutton");
		sound = document.getElementById("sound");
		gongURL = getMetaData("audio");
		if (gongbutton) {
			if (window.EventSource) {
				gongSetup();
			} else {
				disableGong();
			}
		}
	}

	$(document).ready(init);
	return {
	disableGong: disableGong
	};
})();
'use strict';

if (!waitlist) {
	var waitlist = {};
}

waitlist.linemember = (function() {
	var getMetaData = waitlist.base.getMetaData;
	const disableGong = waitlist.gong.disableGong;
	var settings = {};

	function getFitUpdateUrl(fitID) {
		return settings.fit_update_url.replace('-1', fitID);
	}

	function removeSelf() {
		var settings = {
			dataType: "text",
			headers: {
				'X-CSRFToken': getMetaData('csrf-token')
			},
			method: 'DELETE',
			url: getMetaData('url-self-remove-all')
		};
		$.ajax(settings);
	}

	function removeOwnEntry(wlId, charId, entryId) {
		var settings = {
			dataType: "text",
			headers: {
				'X-CSRFToken': getMetaData('csrf-token')
			},
			method: 'DELETE',
			url: "/api/fittings/self/entry/" + entryId
		};
		$.ajax(settings);
	}

	function removeOwnFit(event) {
		var target = $(event.currentTarget);
		var fitId = Number(target.attr('data-fit'));
		event.stopPropagation();
		var options = {
			dataType: "text",
			headers: {
				'X-CSRFToken': getMetaData('csrf-token')
			},
			method: 'DELETE',
			url: settings.self_fit_remove_url.replace('-1', fitId)
		};
		$.ajax(options);
	}

	function updateFit(event) {
		event.stopPropagation();
		var target = $(event.currentTarget);
		var fitId = Number(target.attr('data-fit'));
		var updateUrl = getFitUpdateUrl(fitId);
		window.location = updateUrl;
	}

	function removeOwnEntryHandler(event) {
		var target = $(event.currentTarget);
		var wlId = target.attr('data-wlId');
		var charId = target.attr('data-characterid');
		var entryId = target.attr('data-entryId');
		removeOwnEntry(wlId, charId, entryId);
	}

	function removeSelfHandler() {
		removeSelf();
		disableGong();
		$('.wlb').remove();
	}

	function init() {
		settings.fit_update_url = getMetaData('api-fit-update');
		settings.self_fit_remove_url = getMetaData('api-remove-own-fit')

		// setup handler for the leave waitlist button
		$('body').on('click', '[data-action="removeSelfFromWaitlists"]',
			removeSelfHandler);

		// setup fit button handler related to linemembers
		$("#waitlists").on("click", '[data-action="remove-own-fit"]',
			removeOwnFit);
		$("#waitlists").on("click", '[data-action="update-fit"]', updateFit);
		$("#waitlists").on('click', '[data-action="removeOwnEntry"]',
			removeOwnEntryHandler);
	}

	$(document).ready(init);

	return {};
})();
