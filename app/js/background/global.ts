import { ModuleData } from "./moduleTypes";
import { Globals, CRMTemplates } from './sharedTypes';
import { EncodedString } from '../../elements/elements';

export namespace Global {
	export let modules: ModuleData;

	export function initModule(_modules: ModuleData) {
		modules = _modules;
	}

	export const globals: Globals = {
		latestId: 0,
		storages: {
			insufficientPermissions: [],
			settingsStorage: null,
			nodeStorageSync: null,
			globalExcludes: null,
			resourceKeys: null,
			urlDataPairs: null,
			storageLocal: null,
			failedLookups: [],
			nodeStorage: null,
			resources: null
		},
		background: {
			byId: new window.Map()
		},
		crm: {
			crmTree: [],
			crmById: new window.Map(),
			safeTree: [],
			crmByIdSafe:new window.Map()
		},
		availablePermissions: [],
		crmValues: {
			tabData: new window.Map([[0, {
				nodes: new window.Map(),
				libraries: new window.Map()
			}]]),
			rootId: null,
			contextMenuIds: new window.Map(),
			nodeInstances: new window.Map(),
			contextMenuInfoById: new window.Map(),
			contextMenuItemTree: [],
			userAddedContextMenus: [],
			userAddedContextMenusById: new window.Map(),
			contextMenuGlobalOverrides: new window.Map(),
			hideNodesOnPagesData: new window.Map(),
			nodeTabStatuses: new window.Map()
		},
		toExecuteNodes: {
			onUrl: {
				documentStart: [],
				documentEnd: []
			},
			always: {
				documentStart: [],
				documentEnd: []
			}
		},
		sendCallbackMessage: (tabId: TabId, tabIndex: TabIndex, id: CRM.GenericNodeId, data: {
			err: boolean;
			errorMessage?: string;
			args?: any[];
			callbackId: number;
		}) => {
			const message = {
				type: (data.err ? 'error' : 'success'),
				data: (data.err ? data.errorMessage : data.args),
				callbackId: data.callbackId,
				messageType: 'callback'
			};

			const tabData = globals.crmValues.tabData;
			try {
				modules.Util.postMessage(tabData.get(tabId).nodes.get(id)[tabIndex].port, message);
			} catch (e) {
				if (e.message === 'Converting circular structure to JSON') {
					message.data = 'Converting circular structure to JSON, ' + 
						'getting a response from this API will not work';
					message.type = 'error';
					modules.Util.postMessage(tabData.get(tabId).nodes.get(id)[tabIndex].port, message);
				} else {
					throw e;
				}
			}
		},
		eventListeners: {
			notificationListeners: new window.Map(),
			shortcutListeners: new window.Map(),
			scriptDebugListeners: []
		},
		logging: {
			filter: {
				id: null,
				tabId: null
			}
		},
		constants: {
			supportedHashes: ['sha1', 'sha256', 'sha384', 'sha512', 'md5'],
			validSchemes: ['http', 'https', 'file', 'ftp', '*'],
			templates: {
				mergeArrays<T extends T[] | U[], U>(this: CRMTemplates, mainArray: T, additionArray: T): T {
					for (let i = 0; i < additionArray.length; i++) {
						if (mainArray[i] &&
							typeof additionArray[i] === 'object' &&
							typeof mainArray[i] === 'object' &&
							mainArray[i] !== undefined &&
							mainArray[i] !== null) {
								if (Array.isArray(additionArray[i])) {
									mainArray[i] = this.mergeArrays(mainArray[i] as T, additionArray[i] as T);
								} else {
									mainArray[i] = this.mergeObjects(mainArray[i], additionArray[i]);
								}
							} else {
								mainArray[i] = additionArray[i];
							}
					}
					return mainArray;
				},
				mergeObjects<T extends {
					[key: string]: any;
					[key: number]: any;
				}, Y extends Partial<T>>(this: CRMTemplates, mainObject: T, additions: Y): T & Y {
					for (let key in additions) {
						if (additions.hasOwnProperty(key)) {
							if (typeof additions[key] === 'object' &&
								typeof mainObject[key] === 'object' &&
								mainObject[key] !== undefined &&
								mainObject[key] !== null) {
									if (Array.isArray(additions[key])) {
										mainObject[key] = this.mergeArrays(mainObject[key], additions[key]);
									} else {
										mainObject[key] = this.mergeObjects(mainObject[key], additions[key]);
									}
								} else {
									mainObject[key] = additions[key];
								}
						}
					}
					return mainObject as T & Y;
				},
				getDefaultNodeInfo(this: CRMTemplates, options: Partial<CRM.NodeInfo> = {}): CRM.NodeInfo {
					const defaultNodeInfo: Partial<CRM.NodeInfo> = {
						permissions: [],
						installDate: new Date().toLocaleDateString(),
						lastUpdatedAt: Date.now(),
						version: '1.0',
						isRoot: false,
						source: 'local'
					};

					return this.mergeObjects(defaultNodeInfo, options) as CRM.NodeInfo;
				},
				getDefaultLinkNode(this: CRMTemplates, options: Partial<CRM.LinkNode> = {}): CRM.LinkNode {
					const defaultNode: Partial<CRM.LinkNode> = {
						name: 'My Link',
						onContentTypes: [true, true, true, false, false, false],
						type: 'link',
						showOnSpecified: false,
						nodeInfo: this.getDefaultNodeInfo(options.nodeInfo),
						triggers: [{
							url: '*://*.example.com/*',
							not: false
						}],
						isLocal: false,
						value: [{
							newTab: true,
							url: 'https://www.example.com'
						}]
					};

					return this.mergeObjects(defaultNode, options) as CRM.LinkNode;
				},
				getDefaultStylesheetValue(this: CRMTemplates, options: Partial<CRM.StylesheetVal> = {}): CRM.StylesheetVal {
					const value: CRM.StylesheetVal = {
						stylesheet: [].join('\n'),
						launchMode: CRMLaunchModes.RUN_ON_CLICKING,
						toggle: false,
						defaultOn: false,
						options: {},
						convertedStylesheet: null
					};

					return this.mergeObjects(value, options) as CRM.StylesheetVal;
				},
				getDefaultScriptValue(this: CRMTemplates, options: Partial<CRM.ScriptVal> = {}): CRM.ScriptVal {
					const value: CRM.ScriptVal = {
						launchMode: CRMLaunchModes.RUN_ON_CLICKING,
						backgroundLibraries: [],
						libraries: [],
						script: [].join('\n'),
						backgroundScript: '',
						metaTags: {},
						options: {},
						ts: {
							enabled: false,
							backgroundScript: {},
							script: {}
						}
					};

					return this.mergeObjects(value, options) as CRM.ScriptVal;
				},
				getDefaultScriptNode(this: CRMTemplates, options: CRM.PartialScriptNode = {}): CRM.ScriptNode {
					const defaultNode: CRM.PartialScriptNode = {
						name: 'My Script',
						onContentTypes: [true, true, true, false, false, false],
						type: 'script',
						isLocal: false,
						nodeInfo: this.getDefaultNodeInfo(options.nodeInfo),
						triggers: [{
							url: '*://*.example.com/*',
							not: false
						}],
						value: this.getDefaultScriptValue(options.value)
					};

					return this.mergeObjects(defaultNode, options) as CRM.ScriptNode;
				},
				getDefaultStylesheetNode(this: CRMTemplates, options: CRM.PartialStylesheetNode = {}): CRM.StylesheetNode {
					const defaultNode: CRM.PartialStylesheetNode = {
						name: 'My Stylesheet',
						onContentTypes: [true, true, true, false, false, false],
						type: 'stylesheet',
						isLocal: true,
						nodeInfo: this.getDefaultNodeInfo(options.nodeInfo),
						triggers: [{
							url: '*://*.example.com/*',
							not: false
						}],
						value: this.getDefaultStylesheetValue(options.value)
					};

					return this.mergeObjects(defaultNode, options) as CRM.StylesheetNode;
				},
				getDefaultDividerOrMenuNode(this: CRMTemplates, options: Partial<CRM.PassiveNode> = {}, type: 'divider' | 'menu'):
					CRM.DividerNode | CRM.MenuNode {
					const defaultNode: Partial<CRM.PassiveNode> = {
						name: `My ${type[0].toUpperCase() + type.slice(1)}`,
						type: type,
						nodeInfo: this.getDefaultNodeInfo(options.nodeInfo),
						onContentTypes: [true, true, true, false, false, false],
						isLocal: true,
						value: null,
						showOnSpecified: true,
						children: type === 'menu' ? [] : null,
						permissions: []
					};

					return this.mergeObjects(defaultNode, options) as any;
				},
				getDefaultDividerNode(this: CRMTemplates, options: Partial<CRM.DividerNode> = {}): CRM.DividerNode {
					return this.getDefaultDividerOrMenuNode(options, 'divider') as CRM.DividerNode;
				},
				getDefaultMenuNode(this: CRMTemplates, options: Partial<CRM.MenuNode> = {}): CRM.MenuNode {
					return this.getDefaultDividerOrMenuNode(options, 'menu') as CRM.MenuNode;
				},
				globalObjectWrapperCode(name: string, wrapperName: string, chromeVal: string, browserVal: string, 
					fromCache: any = true): string {
						if (fromCache) {
							return modules.Caches.cacheCall(this.globalObjectWrapperCode, arguments)
						}
						return `var ${wrapperName} = (${((REPLACE: {
							REPLACEWrapperName: any;
							REPLACEName: {
								[key: string]: any;
							};
							REPLACECrmAPI: any;
							REPLACEBrowserVal: string;
							REPLACEChromeVal: string;
						}) => {
							//@ts-ignore
							let REPLACEWrapperName: {
								[key: string]: any;
							};
							return (REPLACEWrapperName = (() => {
								const tempWrapper: {
									[key: string]: any;
								} = {};
								const original = REPLACE.REPLACEName;
								for (var prop in original) {
									((prop) => {
										if (prop !== 'webkitStorageInfo' && typeof original[prop] === 'function') {
											tempWrapper[prop] = function() {
												return original[prop].apply(original, arguments);
											}
										} else {
											Object.defineProperty(tempWrapper, prop, {
												get: function() {
													if (original[prop] === original) {
														return tempWrapper;
													} else if (prop === 'crmAPI') {
														return REPLACE.REPLACECrmAPI;
													} else if (prop === 'browser') {
														return REPLACE.REPLACEBrowserVal;
													} else if (prop === 'chrome') {
														return REPLACE.REPLACEChromeVal;
													} else {
														return original[prop];
													}
												},
												set: function(value) {
													tempWrapper[prop] = value;
												}
											});
										}
									})(prop);
								}
								return tempWrapper;
							})());
						}).toString()	
							.replace(/\w+.REPLACEName/g, name)
							.replace(/\w+.REPLACEChromeVal/g, chromeVal)
							.replace(/\w+.REPLACEBrowserVal/g, browserVal)
							.replace(/\w+.REPLACECrmAPI/g, 'crmAPI')
							.replace(/\var\s\w+;/g, `var ${wrapperName};`)
							.replace(/return \(\w+ = \(/g, `return (${wrapperName} = (`)})()`
							.replace(/\n/g, '');
					}
				},
			specialJSON: {
				_regexFlagNames: ['global', 'multiline', 'sticky', 'unicode', 'ignoreCase'],
				_getRegexFlags(this: SpecialJSON, expr: RegExp): string[] {
					const flags: string[] = [];
					this._regexFlagNames.forEach((flagName: string) => {
						if ((expr as any)[flagName]) {
							if (flagName === 'sticky') {
								flags.push('y');
							} else {
								flags.push(flagName[0]);
							}
						}
					});
					return flags;
				},
				_stringifyNonObject(this: SpecialJSON, data: string | number | Function | RegExp | Date | boolean): string {
					if (typeof data === 'function') {
						const fn = data.toString();
						const match = this._fnRegex.exec(fn);
						data = `__fn$${`(${match[2]}){${match[10]}}`}$fn__`;
					} else if (data instanceof RegExp) {
						data = `__regexp$${JSON.stringify({
							regexp: (data as RegExp).source,
							flags: this._getRegexFlags(data)
						})}$regexp__`;
					} else if (data instanceof Date) {
						data = `__date$${data + ''}$date__`;
					} else if (typeof data === 'string') {
						data = (data as string).replace(/\$/g, '\\$');
					}
					return JSON.stringify(data);
				},
				_fnRegex: /^(.|\s)*\(((\w+((\s*),?(\s*)))*)\)(\s*)(=>)?(\s*)\{((.|\n|\r)+)\}$/,
				_specialStringRegex: /^__(fn|regexp|date)\$((.|\n)+)\$\1__$/,
				_fnCommRegex: /^\(((\w+((\s*),?(\s*)))*)\)\{((.|\n|\r)+)\}$/,
				_parseNonObject(this: SpecialJSON, data: string): string | number | Function | RegExp | Date | boolean {
					const dataParsed = JSON.parse(data);
					if (typeof dataParsed === 'string') {
						let matchedData: RegExpExecArray;
						if ((matchedData = this._specialStringRegex.exec(dataParsed))) {
							const dataContent = matchedData[2] as EncodedString<{
								regexp: string;
								flags: string[];
							}>;
							switch (matchedData[1]) {
								case 'fn':
									const fnRegexed = this._fnCommRegex.exec(dataContent);
									if (fnRegexed[1].trim() !== '') {
										return Function(...fnRegexed[1].split(','), fnRegexed[6]);
									} else {
										return new Function(fnRegexed[6]);
									}
								case 'regexp':
									const regExpParsed = JSON.parse(dataContent);
									return new RegExp(regExpParsed.regexp, regExpParsed.flags.join(''));
								case 'date':
									return new Date();
							}
						} else {
							return dataParsed.replace(/\\\$/g, '$');
						}
					}
					return dataParsed;
				},
				_iterate(this: SpecialJSON, copyTarget: ArrOrObj, iterable: ArrOrObj,
					fn: (data: any, index: string | number, container: ArrOrObj) => any) {
					if (Array.isArray(iterable)) {
						copyTarget = copyTarget || [];
						(iterable as any[]).forEach((data: any, key: number, container: any[]) => {
							(copyTarget as any)[key] = fn(data, key, container);
						});
					} else {
						copyTarget = copyTarget || {};
						Object.getOwnPropertyNames(iterable).forEach((key) => {
							(copyTarget as any)[key] = fn(iterable[key], key, iterable);
						});
					}
					return copyTarget;
				},
				_isObject(this: SpecialJSON, data: any): boolean {
					if (data instanceof Date || data instanceof RegExp || data instanceof Function) {
						return false;
					}
					return typeof data === 'object' && !Array.isArray(data);
				},
				_toJSON(this: SpecialJSON, copyTarget: ArrOrObj, data: any, path: (string|number)[], refData: {
					refs: Refs,
					paths: (string|number)[][],
					originalValues: any[]
				}): {
					refs: Refs;
					data: any[];
					rootType: 'array';
				} | {
					refs: Refs;
					data: {
						[key: string]: any;
					};
					rootType: 'object';
				} | {
					refs: Refs;
					data: string;
					rootType: 'normal';
				} {
					if (!(this._isObject(data) || Array.isArray(data))) {
						return {
							refs: [],
							data: this._stringifyNonObject(data),
							rootType: 'normal'
						};
					} else {
						if (refData.originalValues.indexOf(data) === -1) {
							const index = refData.refs.length;
							refData.refs[index] = copyTarget;
							refData.paths[index] = path;
							refData.originalValues[index] = data;
						}
						copyTarget = this._iterate(copyTarget, data, (element: any, key: string | number) => {
							if (!(this._isObject(element) || Array.isArray(element))) {
								return this._stringifyNonObject(element);
							} else {
								let index: number;
								if ((index = refData.originalValues.indexOf(element)) === -1) {
									index = refData.refs.length;

									copyTarget = (Array.isArray(element) ? [] : {});

									//Filler
									refData.refs.push(null);
									refData.paths[index] = path;
									const newData = this._toJSON((copyTarget as any)[key as any], element, path.concat(key), refData);
									refData.refs[index] = newData.data;
									refData.originalValues[index] = element;
								}
								return `__$${index}$__`;
							}
						});
						const isArr = Array.isArray(data);
						if (isArr) {
							return {
								refs: refData.refs,
								data: copyTarget as any[],
								rootType: 'array'
							};
						} else {
							return {
								refs: refData.refs,
								data: copyTarget as {
									[key: string]: any;
								},
								rootType: 'object'
							};
						}
					}
				},
				toJSON(this: SpecialJSON, data: any, refs: Refs = []): string {
					const paths: (string|number)[][] = [[]];
					const originalValues = [data];

					if (!(this._isObject(data) || Array.isArray(data))) {
						return JSON.stringify({
							refs: [],
							data: this._stringifyNonObject(data),
							rootType: 'normal',
							paths: []
						});
					} else {
						let copyTarget = (Array.isArray(data) ? [] : {});

						refs.push(copyTarget);
						copyTarget = this._iterate(copyTarget, data, (element: any, key: string | number) => {
							if (!(this._isObject(element) || Array.isArray(element))) {
								return this._stringifyNonObject(element);
							} else {
								let index: number;
								if ((index = originalValues.indexOf(element)) === -1) {
									index = refs.length;

									//Filler
									refs.push(null);
									const newData = this._toJSON((copyTarget as any)[key], element, [key], {
										refs: refs,
										paths: paths,
										originalValues: originalValues
									}).data;
									originalValues[index] = element;
									paths[index] = [key];
									refs[index] = newData;
								}
								return `__$${index}$__`;
							}
						});
						return JSON.stringify({
							refs: refs,
							data: copyTarget,
							rootType: Array.isArray(data) ? 'array' : 'object',
							paths: paths
						});
					}
				},
				_refRegex: /^__\$(\d+)\$__$/,
				_replaceRefs(this: SpecialJSON, data: ArrOrObj, refs: ParsingRefs): ArrOrObj {
					this._iterate(data, data, (element: string) => {
						let match: RegExpExecArray;
						if ((match = this._refRegex.exec(element))) {
							const refNumber = match[1];
							const ref = refs[~~refNumber];
							if (ref.parsed) {
								return ref.ref;
							}
							ref.parsed = true;
							return this._replaceRefs(ref.ref, refs);
						} else {
							return this._parseNonObject(element);
						}
					});

					return data;
				},
				fromJSON(this: SpecialJSON, str: EncodedString<{
					refs: Refs;
					data: any;
					rootType: 'normal' | 'array' | 'object';
				}>): any {
					const parsed = JSON.parse(str);

					parsed.refs = parsed.refs.map((ref) => {
						return {
							ref: ref,
							parsed: false
						};
					});

					const refs = parsed.refs as {
						ref: any[] | {
							[key: string]: any
						};
						parsed: boolean;
					}[];

					if (parsed.rootType === 'normal') {
						return JSON.parse(parsed.data);
					}

					refs[0].parsed = true;
					return this._replaceRefs(refs[0].ref, refs as ParsingRefs);
				}
			},
			contexts: ['page', 'link', 'selection', 'image', 'video', 'audio'],
			permissions: [
				'alarms',
				'activeTab',
				'background',
				'bookmarks',
				'browsingData',
				'clipboardRead',
				'clipboardWrite',
				'contentSettings',
				'cookies',
				'contentSettings',
				'contextMenus',
				'declarativeContent',
				'desktopCapture',
				'downloads',
				'history',
				'identity',
				'idle',
				'management',
				'notifications',
				'pageCapture',
				'power',
				'printerProvider',
				'privacy',
				'sessions',
				'system.cpu',
				'system.memory',
				'system.storage',
				'tabs',
				'topSites',
				'tabCapture',
				'tts',
				'webNavigation',
				'webRequest',
				'webRequestBlocking'
			],
			tamperMonkeyExtensions: [
				//Tampermonkey chrome
				'gcalenpjmijncebpfijmoaglllgpjagf',
				//Tampermonkey beta chrome
				'dhdgffkkebhmkfjojejmpbldmpobfkfo',
				//Tampermonkey firefox
				'a1ec3820-68cb-430c-8870-2c07ecc68ff6',
				//Violentmonkey firefox
				'7b7e1485-191d-4cb7-91d9-b6121c1157fe',
				//Greasemonkey firefox
				'23c311a8-060b-422e-a46e-80dd73308a3b'
			],
			stylishExtensions: [
				//Stylish chrome
				'fjnbnpbmkenffdnngjfgmeleoegfcffe',
				//Stylus firefox
				'220fd736-2425-4d0a-aa36-6015937215f1'
			]
		},
		listeners: {
			idVals: [],
			tabVals: [],
			ids: [],
			tabs: [],
			log: []
		}
	}
};