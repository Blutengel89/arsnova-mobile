/*--------------------------------------------------------------------------+
 This file is part of ARSnova.
 routes.js
 - Beschreibung: Routing für ARSnova.
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

Ext.Router.draw(function(map) {
	 map.connect('id/:sessionid', {controller: 'auth', action: 'qr'});
	 // The most general route has to appear after specialized routes
	 map.connect(':controller/:action');
	 
	 // TODO: Are these routes even used?
	 map.connect('canteen', {controller: 'canteen', action: 'show'});
	 map.connect('canteenVote', {controller: 'canteen', action: 'showVotePanel'});
	 
	 map.connect('en', {controller: 'lang', action: 'switchTo'});
	 map.connect('de', 	{controller: 'lang', action: 'switchTo'});
});