﻿/// <reference path="../elements.d.ts" />

namespace LogPageElement {
	export const logPageProperties: {
		isLoading: boolean;
	} = {
		isLoading: {
			type: Boolean,
			value: true,
			notify: true
		}
	} as any;

	export class LP {
		static is: string = 'log-page';

		static properties = logPageProperties;

		static ready(this: LogPage) {
			if (window.logConsole && window.logConsole.done) {
				this.isLoading = false;
			}
			window.logPage = this;

			window.setTimeout(function() {
				window.CRMLoaded = window.CRMLoaded || {
					listener: null,
					register(fn) {
						fn();
					}
				};
				window.CRMLoaded.listener && window.CRMLoaded.listener();
			}, 2500);
		}
	}

	if (window.objectify) {
		Polymer(window.objectify(LP));
	} else {
		window.addEventListener('ObjectifyReady', () => {
			Polymer(window.objectify(LP));
		});
	}
}

type LogPage = Polymer.El<'log-page', 
	typeof LogPageElement.LP & typeof LogPageElement.logPageProperties>;