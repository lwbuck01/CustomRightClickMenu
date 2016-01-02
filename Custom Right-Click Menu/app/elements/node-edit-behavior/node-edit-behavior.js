﻿Polymer.NodeEditBehavior = {

	properties: {
		/**
		* The new settings object, to be written on save
		* 
		* @attribute newSettings
		* @type Object
		* @default {}
		*/
		newSettings: {
			type: Object,
			notify: true,
			value: {}
		},
		/**
		* Whether the indicator for content type "page" should be selected
		* 
		* @attribute pageContentSelected
		* @type Boolean
		* @default false
		*/
		pageContentSelected: {
			type: Object,
			notify: true
		},
		/**
		* Whether the indicator for content type "link" should be selected
		* 
		* @attribute linkContentSelected
		* @type Boolean
		* @default false
		*/
		linkContentSelected: {
			type: Object,
			notify: true
		},
		/**
		* Whether the indicator for content type "selection" should be selected
		* 
		* @attribute selectionContentSelected
		* @type Boolean
		* @default false
		*/
		selectionContentSelected: {
			type: Object,
			notify: true
		},
		/**
		* Whether the indicator for content type "image" should be selected
		* 
		* @attribute imageContentSelected
		* @type Boolean
		* @default false
		*/
		imageContentSelected: {
			type: Object,
			notify: true
		},
		/**
		* Whether the indicator for content type "video" should be selected
		* 
		* @attribute videoContentSelected
		* @type Boolean
		* @default false
		*/
		videoContentSelected: {
			type: Object,
			notify: true
		},
		/**
		* Whether the indicator for content type "audio" should be selected
		* 
		* @attribute audioContentSelected
		* @type Boolean
		* @default false
		*/
		audioContentSelected: {
			type: Object,
			notify: true
		}
	},

	getContentTypeLaunchers: function () {
		var i;
		var result = [];
		var arr = ['page', 'link', 'selection', 'image', 'video', 'audio'];
		for (i = 0; i < 6; i++) {
			result[i] = this[arr[i] + 'ContentSelected'];
		}
		console.log(result);
		this.newSettings.onContentTypes = result;
	},

	getTriggers: function () {
		var inputs = $(this).find('.executionTrigger').find('paper-input');
		var triggers = [];
		for (var i = 0; i < inputs.length; i++) {
			triggers[i] = inputs[i].value;
		}
		this.newSettings.triggers = triggers;
	},

	cancel: function () {
		this.cancelChanges && this.cancelChanges();
		window.crmEditPage.animateOut();
	},

	save: function () {
		this.saveChanges && this.saveChanges();

		this.getContentTypeLaunchers();
		this.getTriggers();
		window.crmEditPage.animateOut();

		var itemInEditPage = window.app.editCRM.getCRMElementFromPath(this.item.path, false);
		var newSettings = this.newSettings;
		itemInEditPage.name = newSettings.name;

		if (!newSettings.onContentTypes[window.app.crmType]) {
			window.app.editCRM.build(window.app.editCRM.setMenus);
		}

		if (newSettings.value.launchMode !== undefined && newSettings.value.launchMode !== 0) {
			newSettings.onContentTypes = [true, true, true, true, true, true];
		} else {
			if (!newSettings.onContentTypes[window.app.crmType]) {
				window.app.editCRM.build(window.app.editCRM.setMenus);
			}
		}
		for (var key in newSettings) {
			if (newSettings.hasOwnProperty(key)) {
				this.item[key] = newSettings[key];
			}
		}
		app.upload();
	},

	inputKeyPress: function (e) {
		e.keyCode === 27 && this.cancel();
		e.keyCode === 13 && this.save();
	},

	assignContentTypeSelectedValues: function () {
		var i;
		var arr = ['page', 'link', 'selection', 'image', 'video', 'audio'];
		for (i = 0; i < 6; i++) {
			this[arr[i] + 'ContentSelected'] = this.item.onContentTypes[i];
		}
	},

	checkToggledIconAmount: function (e) {
		var i;
		var toggledAmount = 0;
		var arr = ['page', 'link', 'selection', 'image', 'video', 'audio'];
		for (i = 0; i < 6; i++) {
			if (this[arr[i] + 'ContentSelected']) {
				if (toggledAmount === 1) {
					return true;
				}
				toggledAmount++;
			}
		}
		if (!toggledAmount) {
			var index = 0;
			var element = e.path[0];
			while (element.tagName !== 'PAPER-CHECKBOX') {
				index++;
				element = e.path[index];
			}
			element.checked = true;
			this[element.parentNode.classList[1].split('Type')[0] + 'ContentSelected'] = true;
			window.doc.contentTypeToast.show();
		}
		return false;
	},

	toggleIcon: function (e) {
		var index = 0;
		var element = e.path[0];
		while (!element.classList.contains('showOnContentItemCont')) {
			index++;
			element = e.path[index];
		}
		var checkbox = $(element).find('paper-checkbox')[0];
		checkbox.checked = !checkbox.checked;
		if (!checkbox.checked) {
			this.checkToggledIconAmount({
				path: [checkbox]
			});
		}
	},


	/*
	 * Clears the trigger that is currently clicked on
	 * 
	 * @param {event} event - The event that triggers this (click event)
	 */
	clearTrigger: function (event) {
		var target = event.target;
		if (target.tagName === 'PAPER-ICON-BUTTON') {
			target = target.children[0];
		}
		$(target.parentNode.parentNode).remove();
		var executionTriggers = $(this.$.executionTriggersContainer).find('paper-icon-button').toArray();
		if (executionTriggers.length === 1) {
			executionTriggers[0].style.display = 'none';
		} else {
			executionTriggers.forEach(function (item) {
				item.style.display = 'block';
			});
		}
	},

	/*
	 * Adds a trigger to the list of triggers for the node
	 */
	addTrigger: function () {
		var _this = this;
		var newEl = $('<div class="executionTrigger"><paper-input pattern="(file:///.*|(\*|http|https|file|ftp)://(\*\.[^/]+|\*|([^/\*]+.[^/\*]+))(/(.*))?|(<all_urls>))" auto-validate="true" label="URL match pattern" error-message="This is not a valid URL pattern!" class="triggerInput" value="*://*.example.com/*"></paper-input><paper-icon-button on-tap="clearTrigger" icon="clear"><paper-icon-button on-tap="clearTrigger" icon="clear"></paper-icon-button></div>').insertBefore(this.$.addTrigger);
		newEl.find('paper-icon-button').click(function (e) {
			_this.clearTrigger.apply(_this, [e]);
		});
		var executionTriggers = $(this.$.executionTriggersContainer).find('paper-icon-button').toArray();
		if (executionTriggers.length === 2) {
			executionTriggers[0].style.display = 'block';
		}
	},

	initDropdown: function () {
		if ((this.showTriggers = (this.item.value.launchMode > 1))) {
			this.$.executionTriggersContainer.style.display = 'block';
			this.$.executionTriggersContainer.style.marginLeft = 0;
			this.$.executionTriggersContainer.style.height = 'auto';
		} else {
			this.$.executionTriggersContainer.style.display = 'none';
			this.$.executionTriggersContainer.style.marginLeft = '-110%';
			this.$.executionTriggersContainer.style.height = 0;
		}
		if ((this.showContentTypeChooser = (this.item.value.launchMode === 0))) {
			this.$.showOnContentContainer.style.display = 'block';
			this.$.showOnContentContainer.style.marginLeft = 0;
			this.$.showOnContentContainer.style.height = 'auto';
		} else {
			this.$.showOnContentContainer.style.display = 'none';
			this.$.showOnContentContainer.style.marginLeft = '-110%';
			this.$.showOnContentContainer.style.height = 0;
		}
		this.$.dropdownMenu._addListener(this.selectorStateChange, this);
		if (this.editor) {
			this.editor.display.wrapper.remove();
			this.editor = null;
		}
	},

	_init: function () {
		var _this = this;
		console.log(this.item);
		this.newSettings = JSON.parse(JSON.stringify(this.item));
		console.log(this.newSettings);
		this.assignContentTypeSelectedValues();
		setTimeout(function () {
			_this.$.nameInput.focus();
		}, 350);
	}
};