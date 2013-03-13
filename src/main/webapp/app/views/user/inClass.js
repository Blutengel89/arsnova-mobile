/*--------------------------------------------------------------------------+
 This file is part of ARSnova.
 app/user/inClass.js
 - Beschreibung: Startseite für Session-Teilnehmer.
 - Version:      1.0, 01/05/12
 - Autor(en):    Christian Thomas Weber <christian.t.weber@gmail.com>
 +---------------------------------------------------------------------------+
 This program is free software; you can redistribute it and/or
 modify it under the terms of the GNU General Public License
 as published by the Free Software Foundation; either version 2
 of the License, or any later version.
 +---------------------------------------------------------------------------+
 This program is distributed in the hope that it will be useful,
 but WITHOUT ANY WARRANTY; without even the implied warranty of
 MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 GNU General Public License for more details.
 You should have received a copy of the GNU General Public License
 along with this program; if not, write to the Free Software
 Foundation, Inc., 59 Temple Place - Suite 330, Boston, MA  02111-1307, USA.
 +--------------------------------------------------------------------------*/

Ext.namespace('ARSnova.views.user');

ARSnova.views.user.InClass = Ext.extend(Ext.Panel, {
	
	inClass			: null,
	feedbackButton	: null,
	questionsButton	: null,
	flashcardButton	: null,
	rankingButton	: null,
	quizButton		: null,
	
	/**
	 * If user logged in a session, check for new skill questions
	 */
	checkNewSkillQuestionsTask: {
		name: 'check for new skill questions',
		run: function(){
			ARSnova.mainTabPanel.tabPanel.userTabPanel.inClassPanel.checkNewSkillQuestions();
		},
		interval: 30000
	},
	
	/**
	 * if users feedback vote was removed, notify the user
	 */
	checkFeedbackRemovedTask: {
		name: 'check if my feedback was deleted',
		run: function(){
			ARSnova.mainTabPanel.tabPanel.userTabPanel.inClassPanel.checkFeedbackRemoved();
		},
		interval: 30000
	},
	
	/**
	 * count all actually logged-in users for this session
	 */
	countActiveUsersTask: {
		name: 'count the actually logged in users',
		run: function(){
			ARSnova.mainTabPanel.tabPanel.userTabPanel.inClassPanel.countActiveUsers();
		},
		interval: 15000
	},
	
	/**
	 * check if speaker has closed the session
	 */
	checkSessionStatusTask: {
		name: 'check if this session was closed',
		run: function(){
			ARSnova.mainTabPanel.tabPanel.userTabPanel.inClassPanel.checkSessionStatus();
		},
		interval: 20000
	},
	
	constructor: function(){
		var loggedInCls = '';
		if (ARSnova.loginMode == ARSnova.LOGIN_THM) {
			loggedInCls = 'thm';
		}
		
		this.sessionLogoutButton = new Ext.Button({
			text	: Messages.SESSIONS,
			ui		: 'back',
			cls		: loggedInCls,
			handler	: function() {
				Ext.dispatch({
					controller	: 'sessions',
					action		: 'logout'
				});
			}
		});
		
		this.toolbar = new Ext.Toolbar({
			title: localStorage.getItem("shortName"),
			items: [
		        this.sessionLogoutButton
			]
		});
		
		this.dockedItems = [this.toolbar];
		
		this.feedbackButton = new Ext.Button({
			ui			: 'normal',
			text		: Messages.MY_FEEDBACK,
			cls			: 'forwardListButton',
			badgeText	: '.',
			badgeCls	: 'badgeicon feedbackARSnova',
			controller	: 'feedback',
			action		: 'showVotePanel',
			handler		: this.buttonClicked
		});
		
		this.questionButton = new Ext.Button({
			ui			: 'normal',
			text		: Messages.QUESTIONS_TO_STUDENTS,
			cls			: 'forwardListButton',
			badgeCls	: 'badgeicon',
			controller	: 'questions',
			action		: 'index',
			handler		: this.buttonClicked
		});
		
		this.flashcardButton = new Ext.Button({
			ui			: 'normal',
			text		: Messages.FLASHCARDS,
			listeners: {
				click: {
					element: 'el',
					fn: function (e) {
						window.open("http://www.cobocards.com/");
					}
				}
			}
		});
		
		this.rankingButton = new Ext.Button({
			ui			: 'normal',
			text		: Messages.MY_RANKING,
			cls			: 'forwardListButton',
			badgeCls	: 'rankingText',
			controller	: 'ranking',
			action		: 'index',
			handler		: this.buttonClicked
		});
		
		this.inClass = {
			xtype: 'form',
			cls	 : 'standardForm topPadding',
			
			items: [{
				cls: 'gravure',
				html: localStorage.getItem("name")
			}, {
				xtype: 'fieldset',
				cls	 : 'standardFieldset noMargin',
				instructions: "Session-ID: " + ARSnova.formatSessionID(localStorage.getItem("keyword")),
				items: [					
					this.feedbackButton,
					this.questionButton,
					this.flashcardButton
				]
			}
			]
		};
		
		
		
		this.items = [this.inClass];
		
		ARSnova.views.user.InClass.superclass.constructor.call(this);
	},
	
	initComponent: function(){
		this.on('destroy', this.destroyListeners);
		
		ARSnova.views.user.InClass.superclass.initComponent.call(this);
	},
	
	/* will be called on session login */
	registerListeners: function(){
		var panel = ARSnova.mainTabPanel.tabPanel.userTabPanel.inClassPanel;
		taskManager.start(panel.checkNewSkillQuestionsTask);
		taskManager.start(panel.checkFeedbackRemovedTask);
		taskManager.start(panel.countActiveUsersTask);
		taskManager.start(panel.checkSessionStatusTask);
	},
	
	/* will be called on session logout */
	destroyListeners: function(){
		var panel = ARSnova.mainTabPanel.tabPanel.userTabPanel.inClassPanel;
		taskManager.stop(panel.checkNewSkillQuestionsTask);
		taskManager.stop(panel.checkFeedbackRemovedTask);
		taskManager.stop(panel.countActiveUsersTask);
		taskManager.stop(panel.checkSessionStatusTask);
	},
	
	/**
	 * fetch all new unanswered skill questions for this session and show a notification
	 * if user don't want to answer this questions now, save this opinion in localStorage
	 */
	checkNewSkillQuestions: function(){
		ARSnova.questionModel.getUnansweredSkillQuestions(localStorage.getItem("keyword"), {
			success: function(newQuestions){
				ARSnova.mainTabPanel.tabPanel.userTabPanel.inClassPanel.questionButton.setBadge(newQuestions.length);
				ARSnova.mainTabPanel.tabPanel.userQuestionsPanel.tab.setBadge(newQuestions.length);
				
				if (newQuestions.length > 0) {
					var showNotification = false;
    				var questionsArr = Ext.decode(localStorage.getItem('questionIds'));
    				
					//check for each question if exists a "dont-remind-me"-flag
					for(var i = 0; i < newQuestions.length; i++){
						var question = newQuestions[i];
						if (questionsArr.indexOf(question) == -1){
							questionsArr.push(question);
							showNotification = true;
						}
					}
					localStorage.setItem('questionIds', Ext.encode(questionsArr));
					if (!showNotification) return;
					
					if(newQuestions.length == 1){
						ARSnova.questionModel.getQuestionById(newQuestions[0], {
							success: function(response){
								var question = Ext.decode(response.responseText).rows[0].value;
								
								Ext.Msg.confirm(
									Messages.ONE_NEW_QUESTION, 
									'"' + question.text + '"<br>' + Messages.WANNA_ANSWER, 
									function(answer){
										if (answer == 'yes'){ //show the question to the user
											Ext.dispatch({
												controller	: 'questions',
												action		: 'index'
											});
										}
									}
								);
								Ext.Msg.doComponentLayout();
							},
							failure: function() {
				    			console.log("my sessions request failure");
				    		}
						});
					} else {
						//show a notification window
						Ext.Msg.confirm(
							Messages.THERE_ARE + ' ' + newQuestions.length + ' ' + Messages.NEW_QUESTIONS , Messages.WANNA_ANSWER, 
							function(answer){
								if (answer == 'yes'){ //show the question to the user
									Ext.dispatch({
										controller	: 'questions',
										action		: 'index'
									});
								}
							}
						);
						Ext.Msg.doComponentLayout();
					}					
				}
			},
			failure: function(response){
				console.log('error');
			}
		});
	},
	
	buttonClicked: function(button){
		Ext.dispatch({
			controller	: button.controller,
			action		: button.action
		});
	},
	
	checkFeedbackRemoved: function() {
		if (localStorage.getItem('user has voted')){
			ARSnova.feedbackModel.getUserFeedback(localStorage.getItem("keyword"), {
				empty: function(response){
					Ext.Msg.alert(Messages.NOTICE, Messages.FEEDBACK_RESET);
					Ext.Msg.doComponentLayout();
					localStorage.removeItem('user has voted');
					
					var feedbackButton = ARSnova.mainTabPanel.tabPanel.userTabPanel.inClassPanel.feedbackButton;
					feedbackButton.badgeEl ? feedbackButton.badgeEl.remove() : '';
					feedbackButton.badgeEl = null;
					feedbackButton.badgeCls = "badgeicon feedbackARSnova";
					feedbackButton.setBadge(".");
				},
				success: function() {},
				failure: function(){
					console.log('server-side error feedbackModel save');
				}
			});
		}
	},
	
	countActiveUsers: function(){
		ARSnova.loggedInModel.countActiveUsersBySession(localStorage.getItem("keyword"), {
			success: function(response){
				var value = parseInt(response.responseText);
				
				//update feedback counter
				var counterEl = ARSnova.mainTabPanel.tabPanel.feedbackTabPanel.statisticPanel.feedbackCounter;
				var title = counterEl.getText().split("/");
				title[1] = value;
				title = title.join("/");
				counterEl.update(title);
			},
			failure: function(){
				console.log('server-side error');
			}
		});
	},
	
	/* if the session was closed, show a notification window and stop this task */
	checkSessionStatus: function(){
		ARSnova.sessionModel.isActive(localStorage.getItem("keyword"), {
			success: function(isActive){
				if (!isActive) {
					Ext.Msg.show({
						title: 'Hinweis:',
						msg: Messages.SESSION_CLOSE_NOTICE,
						buttons: [{
							text: Messages.NOTICE_READ,
							ui: 'action'
						}]
					});
					Ext.Msg.doComponentLayout();
					
					taskManager.stop(ARSnova.mainTabPanel.tabPanel.userTabPanel.inClassPanel.checkSessionStatusTask);
				}
			},
			failure: function(){
				console.log('server-side error');
			}
		});
	}
});