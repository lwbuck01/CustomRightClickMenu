/// <reference path="../elements.d.ts" />

namespace SplashScreenElement {
	export const splashScreenProperties: {
		name: string;
		finished: boolean;
	} = {
		name: {
			type: String,
			value: '',
			notify: true
		},
		finished: {
			type: Boolean,
			value: false,
			notify: true,
			observer: '_onFinish'
		}
	} as any;

	export class SS {
		static is: string = 'splash-screen';

		static properties = splashScreenProperties;

		private static _settings: {
			lastReachedProgress: number;
			max: number;
			toReach: number;
			isAnimating: boolean;
			shouldAnimate: boolean;
		};

		static _onFinish(this: SplashScreen) {
			if (this.finished) {
				this.setAttribute('invisible', 'invisible');
			} else {
				this.removeAttribute('invisible');
			}
		}

		private static _animateTo(this: SplashScreen, progress: number, scaleAfter: string) {
			return new Promise((resolve) => {
				this.$.progressBar.style.transform = scaleAfter;
				this.$.progressBar.style.WebkitTransform = scaleAfter;
				this.async(() => {
					this._settings.lastReachedProgress = progress;
					this._settings.isAnimating = false;
					this.$.progressBar.style.transform = scaleAfter;
					this.$.progressBar.style.WebkitTransform = scaleAfter;
					resolve(null);
				}, 200);
			});
		}

		private static async _animateLoadingBar(this: SplashScreen, progress: number) {
			const scaleAfter = 'scaleX(' + progress + ')';
			const isAtMax = this._settings.max === this._settings.lastReachedProgress;
			if (isAtMax || this._settings.toReach >= 1) {
				this._animateTo(progress, scaleAfter);
				return;
			}
			if (this._settings.isAnimating) {
				this._settings.toReach = progress;
				this._settings.shouldAnimate = true;
			} else {
				await this._animateTo(progress, scaleAfter);
				this._animateLoadingBar(this._settings.toReach);
			}
		};

		static setProgress(this: SplashScreen, progress: number) {
			this._animateLoadingBar(Math.min(progress, 1.0));
		}

		static finish(this: SplashScreen) {
			this.finished = true;
			this._onFinish();
		}

		static init(this: SplashScreen, max: number) {
			this._settings.max = max;
		}

		static ready(this: SplashScreen) {
			this.$.splashContainer.setAttribute('visible', 'visible');
			this._settings = {
				lastReachedProgress: 0,
				toReach: 0,
				isAnimating: false,
				shouldAnimate: false,
				max: 1
			}
		};
	}

	if (window.objectify) {
		Polymer(window.objectify(SS));
	} else {
		window.addEventListener('ObjectifyReady', () => {
			Polymer(window.objectify(SS));
		});
	}
}

type SplashScreen = Polymer.El<'splash-screen', typeof SplashScreenElement.SS & typeof SplashScreenElement.splashScreenProperties>;