﻿/// <reference path="../../elements.d.ts" />

namespace ScriptEditElement {
	export const scriptEditProperties: {
		item: CRM.ScriptNode;
	} = {
		item: {
			type: Object,
			value: {},
			notify: true
		}
	} as any;

	export class SCE {
		static is: string = 'script-edit';

		static behaviors = [Polymer.NodeEditBehavior, Polymer.CodeEditBehavior];

		static properties = scriptEditProperties;

		private static _permissionDialogListeners: Array<() => void> = [];

		static openDocs() {
			const docsUrl = 'http://sanderronde.github.io/CustomRightClickMenu/documentation/classes/crm.crmapi.crmapiinstance.html';
			window.open(docsUrl, '_blank');
		}

		static onKeyBindingKeyDown(this: NodeEditBehaviorScriptInstance, e: Polymer.PolymerKeyDownEvent) {
			const input = window.app.util.findElementWithTagname(e.path, 'paper-input');
			const index = ~~input.getAttribute('data-index');
			this.createKeyBindingListener(input, this.keyBindings[index]);
		}

		static clearTriggerAndNotifyMetaTags(this: NodeEditBehaviorScriptInstance, e: Polymer.ClickEvent) {
			if (this.shadowRoot.querySelectorAll('.executionTrigger').length === 1) {
				window.doc.messageToast.text = 'You need to have at least one trigger';
				window.doc.messageToast.show();
				return;
			}

			(this as NodeEditBehaviorInstance).clearTrigger(e);
		};

		private static disableButtons(this: NodeEditBehaviorScriptInstance) {
			this.$.dropdownMenu.disable();
		};

		private static enableButtons(this: NodeEditBehaviorScriptInstance) {
			this.$.dropdownMenu.enable();
		};

		private static changeTab(this: NodeEditBehaviorScriptInstance, mode: 'main'|'background') {
			if (mode !== this.editorMode) {
				if (mode === 'main') {
					if (this.editorMode === 'background') {
						this.newSettings.value.backgroundScript = this.editorManager.editor.getValue();
					}
					this.editorMode = 'main';
					this.enableButtons();
					this.editorManager.switchToModel('default', this.newSettings.value.script, 'javascript');
				} else if (mode === 'background') {
					if (this.editorMode === 'main') {
						this.newSettings.value.script = this.editorManager.editor.getValue();
					}
					this.editorMode = 'background';
					this.disableButtons();
					this.editorManager.switchToModel('background', this.newSettings.value.backgroundScript || '', 'javascript');
				}

				const element = window.app.shadowRoot.querySelector(mode === 'main' ? '.mainEditorTab' : '.backgroundEditorTab');
				Array.prototype.slice.apply(window.app.shadowRoot.querySelectorAll('.editorTab')).forEach(
				function(tab: HTMLElement) {
					tab.classList.remove('active');
				});
				element.classList.add('active');
			}
		};

		static switchBetweenScripts(this: NodeEditBehaviorScriptInstance, element: Polymer.PolymerElement) {
			element.classList.remove('optionsEditorTab');
			if (this.editorMode === 'options') {
				try {
					this.newSettings.value.options = JSON.parse(this.editorManager.editor.getValue());
				} catch(e) {
					this.newSettings.value.options = this.editorManager.editor.getValue();
				}
			}
			this.hideCodeOptions();
			this.initKeyBindings();
		}

		static changeTabEvent(this: NodeEditBehaviorScriptInstance, e: Polymer.ClickEvent) {
			const element = window.app.util.findElementWithClassName(e.path, 'editorTab');

			const isMain = element.classList.contains('mainEditorTab');
			const isBackground = element.classList.contains('backgroundEditorTab');
			if (isMain && this.editorMode !== 'main') {
				this.switchBetweenScripts(element);
				this.changeTab('main');
			} else if (!isMain && isBackground && this.editorMode !== 'background') {
				this.switchBetweenScripts(element);
				this.changeTab('background');
			} else if (!isBackground && this.editorMode !== 'options') {
				element.classList.add('optionsEditorTab');
				if (this.editorMode === 'main') {
					this.newSettings.value.script = this.editorManager.editor.getValue();
				} else if (this.editorMode === 'background') {
					this.newSettings.value.backgroundScript = this.editorManager.editor.getValue();
				}
				this.showCodeOptions();
				this.editorMode = 'options';
			}

			Array.prototype.slice.apply(window.app.shadowRoot.querySelectorAll('.editorTab')).forEach(
				function(tab: HTMLElement) {
					tab.classList.remove('active');
				});
			element.classList.add('active');
		};

		private static getExportData(this: NodeEditBehaviorScriptInstance) {
			const settings = {};
			this.save(null, settings);
			this.$.dropdownMenu.selected = 0;
			return settings as CRM.ScriptNode;
		};

		static exportScriptAsCRM(this: NodeEditBehaviorScriptInstance) {
			window.app.editCRM.exportSingleNode(this.getExportData(), 'CRM');
		};

		static exportScriptAsUserscript(this: NodeEditBehaviorScriptInstance) {
			window.app.editCRM.exportSingleNode(this.getExportData(), 'Userscript');
		};

		static cancelChanges(this: NodeEditBehaviorScriptInstance) {
			if (this.fullscreen) {
				this.exitFullScreen();
			}
			window.setTimeout(() => {
				this.finishEditing();
				window.externalEditor.cancelOpenFiles();
				this.active = false;
			}, this.fullscreen ? 500 : 0);
		};

		/**
		 * Gets the values of the metatag block
		 */
		private static _getMetaTagValues(this: NodeEditBehaviorScriptInstance) {
			return (this.editorManager.getTypeHandler() as any).getMetaBlock().content;
		};


		static saveChanges(this: NodeEditBehaviorScriptInstance, resultStorage: Partial<CRM.ScriptNode>) {
			resultStorage.value.metaTags = this._getMetaTagValues();
			this.finishEditing();
			window.externalEditor.cancelOpenFiles();
			this.changeTab('main');
			this.active = false;
		};

		private static onPermissionsDialogOpen(extensionWideEnabledPermissions: Array<string>,
			settingsStorage: Partial<CRM.ScriptNode>) {
				let el, svg;
				const showBotEls = Array.prototype.slice.apply(window.app.shadowRoot.querySelectorAll('.requestPermissionsShowBot'));
				const newListeners: Array<() => void> = [];
				showBotEls.forEach((showBotEl: HTMLElement) => {
					this._permissionDialogListeners.forEach((listener) => {
						showBotEl.removeEventListener('click', listener);
					});
					const listener = () => {
						el = $(showBotEl).parent().parent().children('.requestPermissionsPermissionBotCont')[0] as HTMLElement & {
							animation: Animation;
						};
						svg = $(showBotEl).find('.requestPermissionsSvg')[0];
						svg.style.transform = (svg.style.transform === 'rotate(90deg)' || svg.style.transform === '' ? 'rotate(270deg)' : 'rotate(90deg)');
						if (el.animation) {
							el.animation.reverse();
						} else {
							el.animation = el.animate([
								{
									height: 0
								}, {
									height: el.scrollHeight + 'px'
								}
							], {
								duration: 250,
								easing: 'bez',
								fill: 'both'
							});
						}
					};
					newListeners.push(listener);
					showBotEl.addEventListener('click', listener);
				});
				this._permissionDialogListeners = newListeners;

				let permission: CRM.Permission;
				const requestPermissionButtonElements = Array.prototype.slice.apply(window.app.shadowRoot.querySelectorAll('.requestPermissionButton'));
				requestPermissionButtonElements.forEach((requestPermissionButton: HTMLPaperToggleButtonElement) => {
					requestPermissionButton.removeEventListener('click');
					requestPermissionButton.addEventListener('click', () => {
						permission = requestPermissionButton.previousElementSibling.previousElementSibling.textContent as CRM.Permission;
						const slider = requestPermissionButton;
						if (requestPermissionButton.checked) {
							if (Array.prototype.slice.apply(extensionWideEnabledPermissions).indexOf(permission) === -1) {
								chrome.permissions.request({
									permissions: [permission]
								}, function(accepted) {
									if (!accepted) {
										//The user didn't accept, don't pretend it's active when it's not, turn it off
										slider.checked = false;
									} else {
										//Accepted, remove from to-request permissions if it's there
										chrome.storage.local.get(function(e: CRM.StorageLocal) {
											const permissionsToRequest = e.requestPermissions;
											permissionsToRequest.splice(permissionsToRequest.indexOf(permission), 1);
											chrome.storage.local.set({
												requestPermissions: permissionsToRequest
											});
										});

										//Add to script's permissions
										settingsStorage.permissions = settingsStorage.permissions || [];
										settingsStorage.permissions.push(permission);
									}
								});
							} else {
								//Add to script's permissions
								settingsStorage.permissions = settingsStorage.permissions || [];
								settingsStorage.permissions.push(permission);
							}
						} else {
							//Remove from script's permissions
							settingsStorage.permissions.splice(settingsStorage.permissions.indexOf(permission), 1);
						}
					});
				});
			}

		static openPermissionsDialog(this: NodeEditBehaviorScriptInstance, item: Polymer.ClickEvent|CRM.ScriptNode,
				callback: () => void) {
			let nodeItem: CRM.ScriptNode;
			let settingsStorage: Partial<CRM.ScriptNode>;
			if (!item || item.type === 'tap') {
				//It's an event, ignore it
				nodeItem = this.item;
				settingsStorage = this.newSettings;
			} else {
				nodeItem = item;
				settingsStorage = item;
			}
			//Prepare all permissions
			chrome.permissions.getAll(({permissions}) => {
				if (!nodeItem.permissions) {
					nodeItem.permissions = [];
				}
				const scriptPermissions = nodeItem.permissions;
				const crmPermissions = window.app.templates.getScriptPermissions();

				const askedPermissions = (nodeItem.nodeInfo &&
					nodeItem.nodeInfo.permissions) || [];

				const requiredActive: Array<{
					name: string;
					toggled: boolean;
					required: boolean;
					description: string;
				}> = [];
				const requiredInactive: Array<{
					name: string;
					toggled: boolean;
					required: boolean;
					description: string;
				}> = [];
				const nonRequiredActive: Array<{
					name: string;
					toggled: boolean;
					required: boolean;
					description: string;
				}> = [];
				const nonRequiredNonActive: Array<{
					name: string;
					toggled: boolean;
					required: boolean;
					description: string;
				}> = [];

				let isAsked;
				let isActive;
				let permissionObj;
				crmPermissions.forEach(function(permission) {
					isAsked = askedPermissions.indexOf(permission) > -1;
					isActive = scriptPermissions.indexOf(permission as CRM.Permission) > -1;

					permissionObj = {
						name: permission,
						toggled: isActive,
						required: isAsked,
						description: window.app.templates.getPermissionDescription(permission)
					};

					if (isAsked && isActive) {
						requiredActive.push(permissionObj);
					} else if (isAsked && !isActive) {
						requiredInactive.push(permissionObj);
					} else if (!isAsked && isActive) {
						nonRequiredActive.push(permissionObj);
					} else {
						nonRequiredNonActive.push(permissionObj);
					}
				});

				const permissionList = nonRequiredActive;
				permissionList.push.apply(permissionList, requiredActive);
				permissionList.push.apply(permissionList, requiredInactive);
				permissionList.push.apply(permissionList, nonRequiredNonActive);

				window.app.$.scriptPermissionsTemplate.items = permissionList;
				window.app.shadowRoot.querySelector('.requestPermissionsScriptName').innerHTML = 'Managing permisions for script "' + nodeItem.name;
				const scriptPermissionDialog = window.app.$.scriptPermissionDialog;
				scriptPermissionDialog.addEventListener('iron-overlay-opened', () => {
					this.onPermissionsDialogOpen(permissions, settingsStorage);
				});
				scriptPermissionDialog.addEventListener('iron-overlay-closed', callback);
				scriptPermissionDialog.open();
			});
		};

		/**
		 * Reloads the editor completely (to apply new settings)
		 */
		static reloadEditor(this: NodeEditBehaviorScriptInstance, disable: boolean = false) {
			if (this.editorManager) {
				if (this.editorMode === 'main') {
					this.newSettings.value.script = this.editorManager.editor.getValue();
				} else if (this.editorMode === 'background') {
					this.newSettings.value.backgroundScript = this.editorManager.editor.getValue();
				} else {
					try {
						this.newSettings.value.options = JSON.parse(this.editorManager.editor.getValue());
					} catch(e) {
						this.newSettings.value.options = this.editorManager.editor.getValue();
					}
				}
				this.editorManager.destroy();
			}

			let value: string;
			if (this.editorMode === 'main') {
				value = this.newSettings.value.script;
			} else if (this.editorMode === 'background') {
				value = this.newSettings.value.backgroundScript;
			} else {
				if (typeof this.newSettings.value.options === 'string') {
					value = this.newSettings.value.options;
				} else {
					value = JSON.stringify(this.newSettings.value.options);
				}
			}

			if (this.fullscreen) {
				this.fullscreenEditorManager.reset();
				const editor = this.fullscreenEditorManager.editor;
				if (!this.fullscreenEditorManager.isDiff(editor)) {
					editor.setValue(value);
				}
			} else {
				this.editorManager.reset();
				const editor = this.editorManager.editor;
				if (!this.editorManager.isDiff(editor)) {
					editor.setValue(value);
				}
			}
		};

		private static createKeyBindingListener(this: NodeEditBehaviorScriptInstance, element: HTMLPaperInputElement, keyBinding: {
			name: string;
			defaultKey: string;
			monacoKey: string;
			storageKey: keyof CRM.KeyBindings;
		}) {
			return (event: KeyboardEvent) => {
				event.preventDefault();
				//Make sure it's not just one modifier key being pressed and nothing else
				if (event.keyCode < 16 || event.keyCode > 18) {
					//Make sure at least one modifier is being pressed
					if (event.altKey || event.shiftKey || event.ctrlKey) {
						const values = [];
						if (event.ctrlKey) {
							values.push('Ctrl');
						}
						if (event.altKey) {
							values.push('Alt');
						}
						if (event.shiftKey) {
							values.push('Shift');
						}

						values.push(String.fromCharCode(event.keyCode));
						const value = element.value = values.join('-');
						element.setAttribute('data-prev-value', value);
						window.app.settings.editor.keyBindings = window.app.settings.editor.keyBindings || {
							goToDef: this.keyBindings[0].defaultKey,
							rename: this.keyBindings[1].defaultKey
						};

						window.app.settings.editor.keyBindings[keyBinding.storageKey] = value;
						this.initKeyBinding(keyBinding);
					}
				}

				element.value = element.getAttribute('data-prev-value') || '';
				return;
			};
		};

		static keyBindings: Array<{
			name: string;
			defaultKey: string;
			monacoKey: string;
			storageKey: keyof CRM.KeyBindings;
		}> = [{
				name: 'Go To Type Definition',
				defaultKey: 'Ctrl-F12',
				monacoKey: 'editor.action.goToTypeDefinition',
				storageKey: 'goToDef'
			}, {
				name: 'Rename Symbol',
				defaultKey: 'Ctrl-F2',
				monacoKey: 'editor.action.rename',
				storageKey: 'rename'
			}
		];

		private static translateKeyCombination(this: NodeEditBehaviorScriptInstance, keys: string): Array<number> {
			const monacoKeys: Array<number> = [];
			for (const key of keys.split('-')) {
				if (key === 'Ctrl') {
					monacoKeys.push(monaco.KeyMod.CtrlCmd);
				} else if (key === 'Alt') {
					monacoKeys.push(monaco.KeyMod.Alt);
				} else if (key === 'Shift') {
					monacoKeys.push(monaco.KeyMod.Shift);
				} else {
					if (monaco.KeyCode[`KEY_${key.toUpperCase()}` as any]) {
						monacoKeys.push(monaco.KeyCode[`KEY_${key.toUpperCase()}` as any] as any);
					}
				}
			}
			return monacoKeys;
		}

		private static initKeyBinding(this: NodeEditBehaviorScriptInstance, keyBinding: {
			name: string;
			defaultKey: string;
			monacoKey: string;
			storageKey: "goToDef" | "rename";
		}, key: string = keyBinding.defaultKey) {
			const editor = this.editorManager.editor;
			if (!this.editorManager.isDiff(editor)) {
				const oldAction = editor.getAction(keyBinding.monacoKey);
				editor.addAction({
					id: keyBinding.monacoKey,
					label: keyBinding.name,
					run: () => {
						oldAction.run();
					},
					keybindings: this.translateKeyCombination(key),
					precondition: (oldAction as any)._precondition
				});
			}
		}

		/**
		 * Initializes the keybindings for the editor
		 */
		private static initKeyBindings(this: NodeEditBehaviorScriptInstance) {
			for (const keyBinding of this.keyBindings) {
				this.initKeyBinding(keyBinding);
			}
		};

		/**
		 * Triggered when the monaco editor has been loaded, fills it with the options and fullscreen element
		 */
		static editorLoaded(this: NodeEditBehaviorScriptInstance) {
			const editorManager = this.editorManager;
			(editorManager.getTypeHandler() as any).listen('metaChange', (oldMetaTags: MonacoEditorElement.MetaBlock, newMetaTags: MonacoEditorElement.MetaBlock) => {
				if (this.editorMode === 'main') {
					this.newSettings.value.metaTags = JSON.parse(JSON.stringify(newMetaTags));
				}
			});
			this.$.mainEditorTab.classList.add('active');
			this.$.backgroundEditorTab.classList.remove('active');

			editorManager.editor.getDomNode().classList.remove('stylesheet-edit-codeMirror');
			editorManager.editor.getDomNode().classList.add('script-edit-codeMirror');
			editorManager.editor.getDomNode().classList.add('small');

			if (this.fullscreen) {
				this.$.editorFullScreen.children[0].innerHTML = '<path d="M10 32h6v6h4V28H10v4zm6-16h-6v4h10V10h-4v6zm12 22h4v-6h6v-4H28v10zm4-22v-6h-4v10h10v-4h-6z"/>';
			}
			this.initKeyBindings();
		};

		/**
		 * Loads the monaco editor
		 */
		private static async loadEditor(this: NodeEditBehaviorScriptInstance, content: string = this.item.value.script,
				disable: boolean = false) {
			const placeHolder = $(this.$.editor);
			this.editorHeight = placeHolder.height();
			this.editorWidth = placeHolder.width();
			!window.app.settings.editor && (window.app.settings.editor = {
				theme: 'dark',
				zoom: '100',
				keyBindings: {
					goToDef: this.keyBindings[0].defaultKey,
					rename: this.keyBindings[1].defaultKey
				},
				cssUnderlineDisabled: false,
				disabledMetaDataHighlight: false
			});
			this.editorManager = await this.$.editor.create('script', {
				value: content,
				language: 'javascript',
				theme: window.app.settings.editor.theme === 'dark' ? 'vs-dark' : 'vs',
				wordWrap: 'off',
				fontSize: (~~window.app.settings.editor.zoom / 100) * 14,
				folding: true
			});
			this.editorLoaded();
		};

		static init(this: NodeEditBehaviorScriptInstance) {
			const _this = this;
			this._init();
			this._CEBIinit();
			this.$.dropdownMenu.init();
			this.$.exportMenu.init();
			this.$.exportMenu.$.dropdownSelected.innerText = 'EXPORT AS';
			this.initDropdown();
			this.selectorStateChange(0, this.newSettings.value.launchMode);
			document.body.classList.remove('editingStylesheet');
			document.body.classList.add('editingScript');
			window.scriptEdit = this;
			window.externalEditor.init();
			if (window.app.storageLocal.recoverUnsavedData) {
				chrome.storage.local.set({
					editing: {
						val: this.item.value.script,
						id: this.item.id,
						mode: _this.editorMode,
						crmType: window.app.crmType
					}
				});
				this.savingInterval = window.setInterval(function() {
					if (_this.active && _this.editorManager) {
						//Save
						const val = _this.editorManager.editor.getValue();
						chrome.storage.local.set({
							editing: {
								val: val,
								id: _this.item.id,
								mode: _this.editorMode,
								crmType: window.app.crmType
							}
							// ReSharper disable once WrongExpressionStatement
						}, function() { chrome.runtime.lastError; });
					} else {
						//Stop this interval
						chrome.storage.local.set({
							editing: false
						});
						window.clearInterval(_this.savingInterval);
					}
				}, 5000);
			}
			this.active = true;
			setTimeout(function() {
				_this.loadEditor();
			}, 750);
		}
	}

	ScriptEditElement
	if (window.objectify) {
		Polymer(window.objectify(SCE));
	} else {
		window.addEventListener('ObjectifyReady', () => {
			Polymer(window.objectify(SCE));
		});
	}
}

type ScriptEdit = Polymer.El<'script-edit', typeof ScriptEditElement.SCE &
	typeof ScriptEditElement.scriptEditProperties>;