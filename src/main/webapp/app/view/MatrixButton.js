/*
 * This file is part of ARSnova Mobile.
 * Copyright (C) 2011-2012 Christian Thomas Weber
 * Copyright (C) 2012-2014 The ARSnova Team
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
Ext.define('ARSnova.view.MatrixButton', {
	extend: 'Ext.Button',
	alias: 'x-matrixbutton',
	xtype: 'matrixbutton',

	requires: ['Ext.Img'],

	config: {
		text: '',
		image: '',
		imageCls: '',
		imageStyle: '',
		
		/**
		 * possible configurations: icon, image, togglefield
		 */
		buttonConfig: '',
		
		/**
		 * configuration of toggle field element
		 */
		toggleConfig: '',
		toggleField: '',
		
		cls: 'noBackground noBorder matrixButton',
		html: ['<span class="iconBtn"></span><span class="gravure buttonText" style="display:block"></span>']
	},
	
	initialize: function() {
		var	buttonText = this.element.select(".buttonText").elements;
		
		switch(this.getButtonConfig()) {
			case 'image':
				this.useImageConfiguration();
				break;
				
			case 'togglefield':
				this.useToggleFieldConfiguration();
				break;
				
			case 'icon':
			default:
				this.useIconConfiguration();
		}
		
		buttonText[0].innerHTML = this.getText();
		this.callParent(arguments);
	},
	
	/**
	 * render icon font to matrixbutton
	 */
	useIconConfiguration: function() {
		Ext.DomHelper.append(this.element.select(".iconBtn").elements[0], {
			tag: 'div', 
			cls: 'iconBtnImg x-button-icon ' + this.getImageCls(),
			style: this.getImageStyle()
		});
	},
	
	/**
	 * render Ext.field.Toggle to matrixbutton
	 */
	useToggleFieldConfiguration: function() {
		var config = this.getToggleConfig();
		config.renderTo = this.element.select(".iconBtn").elements[0];

		this.toggleField = Ext.create('Ext.field.Toggle', config);
	},
	
	/**
	 * render image to matrixbutton
	 */
	useImageConfiguration: function() {
		var me = this,
			promise = new RSVP.Promise(),
			retina = window.devicePixelRatio >= 2,
			imagefile = this.getImage() + ".png",
			imagefile2x = this.getImage() + "@2x.png";
		
		if (this.getImage().indexOf("/") !== 0) {
			imagefile = "resources/images/" + imagefile;
			imagefile2x = "resources/images/" + imagefile2x;
		}
		
		if (retina) {
			var img = new Image();
			img.onload = function imageExists() {
				promise.resolve(imagefile2x);
			};
			img.onerror = function imageNotFound() {
				promise.resolve(imagefile);
			};
			img.src = imagefile2x;
		} else {
			promise.resolve(imagefile);
		}
		
		promise.then(function (theImage) {
			Ext.create('Ext.Img', {
				src: theImage,
				renderTo: me.element.select(".iconBtn").elements[0],
				cls: "iconBtnImg"
			});
		});
	}
});
