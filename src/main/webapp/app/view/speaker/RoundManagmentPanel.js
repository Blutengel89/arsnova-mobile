/*
 * This file is part of ARSnova Mobile.
 * Copyright (C) 2011-2012 Christian Thomas Weber
 * Copyright (C) 2012-2015 The ARSnova Team
 *
 * ARSnova Mobile is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 3 of the License, or
 * (at your option) any later version.
 *
 * ARSnova Mobile is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with ARSnova Mobile.  If not, see <http://www.gnu.org/licenses/>.
 */
Ext.define('ARSnova.view.speaker.RoundManagementPanel', {
	extend: 'Ext.Panel',

	config: {
		title: Messages.ROUND_MANAGEMENT,
		iconCls: 'icon-timer',
		fullscreen: true,
		scrollable: {
			direction: 'vertical',
			directionLock: true
		}
	},

	initialize: function (arguments) {
		this.callParent(arguments);

		this.toolbar = Ext.create('Ext.Toolbar', {
			docked: 'top',
			title: this.getTitle(),
			ui: 'light',
			items: [{
				xtype: 'button',
				text: Messages.STATISTIC,
				ui: 'back',
				scope: this,
				handler: function () {
					ARSnova.app.mainTabPanel.tabPanel.speakerTabPanel.statisticTabPanel.setActiveItem(0);
				}
			}]
		});

		this.countdownTimer = Ext.create('ARSnova.view.components.CountdownTimer', {
			sliderDefaultValue: 2,
			onTimerStart: this.onTimerStart,
			onTimerStop: this.onTimerStop,
			startStopScope: this
		});

		this.startRoundButton = Ext.create('Ext.Button', {
			text: Messages.START_FIRST_ROUND,
			style: 'margin: 0 auto;',
			ui: 'confirm',
			width: 240,
			scope: this,
			handler: function (button) {
				button.disable();
				this.startNewPiRound(this.countdownTimer.slider.getValue() * 60);
				this.startRoundButton.hide();
				this.endRoundButton.show();
				this.cancelRoundButton.show();
				button.enable();
			}
		});

		this.cancelRoundButton = Ext.create('Ext.Button', {
			text: Messages.CANCEL_DELAYED_ROUND,
			style: 'margin: 0 auto;',
			ui: 'action',
			hidden: true,
			width: 240,
			scope: this,
			handler: function (button) {
				button.disable();
				this.cancelPiRound();
				button.enable();
			}
		});

		this.endRoundButton = Ext.create('Ext.Button', {
			text: Messages.END_ROUND_IMMEDIATELY,
			style: 'margin: 0 auto; margin-top: 20px;',
			ui: 'decline',
			hidden: true,
			width: 240,
			scope: this,
			handler: function (button) {
				button.disable();
				Ext.Msg.confirm(Messages.END_ROUND, Messages.END_ROUND_WARNING, function (id) {
					if (id === 'yes') {
						this.countdownTimer.stop();
						this.startNewPiRound();
					}

					button.enable();
				}, this);
			}
		});

		this.questionManagementContainer = Ext.create('Ext.form.FieldSet', {
			title: Messages.QUESTION_MANAGEMENT,
			cls: 'centerFormTitle',
			hidden: true
		});

		this.roundManagementContainer = Ext.create('Ext.form.FieldSet', {
			cls: 'centerFormTitle',
			items: [
				this.countdownTimer,
				this.startRoundButton,
				this.cancelRoundButton,
				this.endRoundButton
			]
		});

		this.add([
			this.toolbar,
			{
				xtype: 'formpanel',
				scrollable: null,
				items: [
					this.roundManagementContainer,
					this.questionManagementContainer
				]
			}
		]);

		this.on('painted', this.onPainted);
		this.onBefore('activate', this.beforeActivate);
	},

	onPainted: function () {console.log(this.statisticChart.questionObj);
		ARSnova.app.innerScrollPanel = this;
	},

	beforeActivate: function () {
		this.statisticChart = ARSnova.app.mainTabPanel.tabPanel.speakerTabPanel.questionStatisticChart;
		this.prepareQuestionManagementContainer();
		this.prepareCountdownTimer();
	},

	onTimerStart: function () {
		this.questionManagementContainer.hide();
	},

	onTimerStop: function () {
	},

	changePiRound: function (questionId) {
		if (this.statisticChart.questionObj._id === questionId) {
			if (this.statisticChart.questionObj.piRound === 1) {
				this.statisticChart.activateFirstSegmentButton();
				this.statisticChart.disablePiRoundElements();
			} else {
				this.statisticChart.activateSecondSegmentButton();
				this.statisticChart.enablePiRoundElements();
			}

			this.questionManagementContainer.show();
			this.startRoundButton.show();
			this.endRoundButton.hide();
			this.cancelRoundButton.hide();
			this.prepareCountdownButtons();
		}
	},

	cancelPiRound: function () {
		var question = Ext.create('ARSnova.model.Question', this.statisticChart.questionObj);
		this.countdownTimer.stop();

		question.cancelDelayedPiRound({
			success: function (response) {
				console.debug('New question round canceled');
			}
		});
	},

	startNewPiRound: function (delay) {
		var question = Ext.create('ARSnova.model.Question', this.statisticChart.questionObj);

		if (!delay || delay < 0) {
			delay = 0;
		}

		question.startNewPiRound(delay, {
			success: function (response) {
				console.debug('New question round started.');
			}
		});
	},

	prepareCountdownTimer: function () {
		var obj = this.statisticChart.questionObj;

		if (obj.piRoundActive) {
			this.countdownTimer.start(obj.piRoundStartTime, obj.piRoundEndTime);
		} else {
			this.countdownTimer.stop();
		}

		this.prepareCountdownButtons();
	},

	prepareQuestionManagementContainer: function () {
		if (!this.editButtons) {
			this.editButtons = Ext.create('ARSnova.view.speaker.ShowcaseEditButtons', {
				speakerStatistics: true,
				buttonClass: 'smallerActionButton',
				questionObj: this.cleanupQuestionObj(this.statisticChart.questionObj)
			});

			this.questionManagementContainer.add(this.editButtons);
			this.questionManagementContainer.show();
		}

		this.updateEditButtons();
	},

	prepareCountdownButtons: function () {
		var questionObj = this.statisticChart.questionObj;

		if (!questionObj.piRoundActive) {
			if (questionObj.piRound === 1) {
				if (!questionObj.piRoundFinished) {
					this.startRoundButton.setText(Messages.START_FIRST_ROUND);
					this.countdownTimer.slider.show();
					this.startRoundButton.show();
				} else if (questionObj.piRoundFinished) {
					this.startRoundButton.setText(Messages.START_SECOND_ROUND);
					this.countdownTimer.slider.show();
					this.startRoundButton.show();
				}
			} else {
				this.countdownTimer.slider.hide();
				this.startRoundButton.hide();
			}
			this.cancelRoundButton.hide();
			this.endRoundButton.hide();
			this.questionManagementContainer.show();
		} else {
			this.endRoundButton.show();
			this.cancelRoundButton.show();
			this.startRoundButton.hide();
			this.questionManagementContainer.hide();
		}
	},

	updateEditButtons: function () {
		var hasAnswers = this.statisticChart.hasAnswers;

		this.editButtons.questionObj = this.statisticChart.questionObj;
		this.editButtons.updateData(this.statisticChart.questionObj);
		this.editButtons.updateDeleteButtonState(hasAnswers);
		this.editButtons.updateQuestionResetButtonState();
	},

	cleanupQuestionObj: function (questionObj) {
		if (questionObj) {
			questionObj.possibleAnswers.forEach(function (answer) {
				delete answer.formattedText;
			});
		}

		return questionObj;
	}
});
