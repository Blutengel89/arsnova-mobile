/*--------------------------------------------------------------------------+
 This file is part of ARSnova.
 app/home/mySessionsPanel.js
 - Beschreibung: Startseite für User in der Rolle "Dozent/in".
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
ARSnova.views.home.MySessionsPanel = Ext.extend(Ext.Panel, {
	scroll: 'vertical',
	
	/* toolbar items */
	toolbar		: null,
	backButton	: null,
	
	/* items */
	createdSessions: null,
	
	constructor: function(){
		this.logoutButton = new Ext.Button({
			text	: Messages.LOGOUT,
			ui		: 'back',
			hidden	: true,
			handler	: function() {
				Ext.Msg.confirm(Messages.LOGOUT, Messages.LOGOUT_REQUEST, function(answer) {
					if (answer == 'yes') {
						Ext.dispatch({
							controller	: 'auth',
							action		: 'logout'
						});
					}
				});
				Ext.Msg.doComponentLayout();
			}
		});
		
		this.backButton = new Ext.Button({
			text	: Messages.HOME,
			ui		: 'back',
			handler	: function() {
				var hTP = ARSnova.mainTabPanel.tabPanel.homeTabPanel;
				hTP.setActiveItem(hTP.homePanel, {
					type		: 'slide',
					direction	: 'right',
					duration	: 700
				});
			}
		});
		
		this.createSessionButton = new Ext.Button({
			text	: '+',
			cls		: 'plusButton',
			scope	: this,
			handler	: function() {
				var hTP = ARSnova.mainTabPanel.tabPanel.homeTabPanel;
				hTP.setActiveItem(hTP.newSessionPanel, {
					type		: 'slide',
					direction	: 'left',
					duration	: 700
				});
			}
		});
		
		this.toolbar = new Ext.Toolbar({
			title: Messages.SESSIONS,
			items: [
		        this.backButton,
		        this.logoutButton,
		        {xtype: 'spacer'},
	            this.createSessionButton
			]
		});
		
		this.newSessionButtonForm = new Ext.form.FormPanel({
			cls: 'topPadding standardForm',
			items: [{
				xtype	: 'button',
				ui		: 'normal',
				text	: Messages.CREATE_NEW_SESSION,
				cls		: 'forwardListButton',
				handler	: function(options){
					var hTP = ARSnova.mainTabPanel.tabPanel.homeTabPanel;
					hTP.setActiveItem(hTP.newSessionPanel, 'slide');
				}
			}]
		});
		
		this.sessionsForm = new Ext.form.FormPanel({
			items: []
		});
		
		this.dockedItems = [this.toolbar],
		this.items = [
		    this.newSessionButtonForm,
            this.sessionsForm
        ],
		
		ARSnova.views.home.MySessionsPanel.superclass.constructor.call(this);
	},
	
	initComponent: function() {
		this.on('activate', function(){
			this.doComponentLayout();	
		});
		this.on('beforeactivate', function(){
			switch (ARSnova.userRole) {
				case ARSnova.USER_ROLE_SPEAKER:
					this.loadCreatedSessions();
					
					this.backButton.hide();
					this.logoutButton.show();
					this.createSessionButton.show();
					break;
				default:
					break;
			}
			if (ARSnova.loginMode == ARSnova.LOGIN_THM) {
				this.logoutButton.addCls('thm');
			}
		});
		
		ARSnova.views.home.MySessionsPanel.superclass.initComponent.call(this);
	},
	
	loadCreatedSessions: function() {
		var me = this;

		ARSnova.showLoadMask(Messages.LOAD_MASK_SEARCH);
		ARSnova.sessionModel.getMySessions({
			success: function(response) {
				var sessions = Ext.decode(response.responseText);
				var panel = ARSnova.mainTabPanel.tabPanel.homeTabPanel.mySessionsPanel;
				var caption = new ARSnova.views.Caption();
				
				panel.sessionsForm.removeAll();
				panel.sessionsForm.show();

				panel.createdSessionsFieldset = new Ext.form.FieldSet({
					cls: 'standardFieldset',
					title: Messages.MY_SESSIONS
				});
				
				var badgePromises = [];
				
				for ( var i = 0, session; session = sessions[i]; i++) {
					var status = "";
					var course = " defaultsession";

					if (session.active && session.active == 1) {
						status = " isActive";
					}

					if (session.courseId && session.courseId.length > 0) {
						course = " coursesession";
					}

					// Minimum width of 321px equals at least landscape view
					var displaytext = window.innerWidth > 321 ? session.name : session.shortName; 
					var sessionButton = new ARSnova.views.MultiBadgeButton({
						ui		: 'normal',
						text		: displaytext,
						cls		: 'forwardListButton' + status + course,
						sessionObj	: session,
						badgeCls	: "badgeicon",
						badgeText	: [],
						handler		: function(options){
							ARSnova.showLoadMask("Login...");
							Ext.dispatch({
								controller	: 'sessions',
								action		: 'login',
								keyword		: options.sessionObj.keyword
							});
						}
					});
					badgePromises.push(me.updateBadges(session._id, session.keyword, sessionButton));
					panel.createdSessionsFieldset.add(sessionButton);
				}
				RSVP.all(badgePromises).then(Ext.createDelegate(caption.explainBadges, caption));
				caption.explainSessionStatus(sessions);
				
				panel.createdSessionsFieldset.add(caption);
				panel.sessionsForm.add(panel.createdSessionsFieldset);
    			
    			panel.doLayout();
    			ARSnova.hideLoadMask();
    		},
			empty: Ext.createDelegate(function() {
				this.sessionsForm.hide();
				ARSnova.hideLoadMask();
			}, this),
			unauthenticated: function() {
				Ext.dispatch({
					controller: "auth",
					action: "login",
					mode: ARSnova.loginMode
				});
			},
    		failure: function() {
    			console.log("my sessions request failure");
    		}
    	}, (window.innerWidth > 321 ? 'name' : 'shortname'));
	},
	
	updateBadges: function(sessionId, sessionKeyword, button) {
		var promise = new RSVP.Promise();
		
		var failureCallback = function() {
			console.log('server-side error: ', arguments);
			promise.reject();
		};
		
		ARSnova.questionModel.countSkillQuestions(sessionKeyword, {
			success: function(response) {
				var numQuestions = parseInt(response.responseText);
				ARSnova.questionModel.countTotalAnswers(sessionKeyword, {
					success: function(response) {
						var numAnswers = parseInt(response.responseText);
						ARSnova.questionModel.countFeedbackQuestions(sessionKeyword, {
							success: function(response) {
								var numFeedbackQuestions = Ext.decode(response.responseText).total;
								
								button.setBadge([
									{badgeText: numFeedbackQuestions, badgeCls: "bluebadgeicon"},
									{badgeText: numQuestions, badgeCls: "badgeicon"},
									{badgeText: numAnswers, badgeCls: "redbadgeicon"}
								]);
								
								promise.resolve({
									hasFeedbackQuestions: numFeedbackQuestions > 0,
									hasQuestions: numQuestions > 0,
									hasAnswers: numAnswers > 0
								});
							},
							failure: failureCallback
						});
					},
					failure: failureCallback
				});
			},
			failure: failureCallback
		});
		
		return promise;
	}
});