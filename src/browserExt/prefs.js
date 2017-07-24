/*
	***** BEGIN LICENSE BLOCK *****
	
	Copyright © 2017 Center for History and New Media
					George Mason University, Fairfax, Virginia, USA
					http://zotero.org
	
	This file is part of Zotero.
	
	Zotero is free software: you can redistribute it and/or modify
	it under the terms of the GNU Affero General Public License as published by
	the Free Software Foundation, either version 3 of the License, or
	(at your option) any later version.
	
	Zotero is distributed in the hope that it will be useful,
	but WITHOUT ANY WARRANTY; without even the implied warranty of
	MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
	GNU Affero General Public License for more details.

	You should have received a copy of the GNU Affero General Public License
	along with Zotero.  If not, see <http://www.gnu.org/licenses/>.
	
	***** END LICENSE BLOCK *****
*/

/**
 * There's a limit of 5MB of locally stored data.
 * https://developer.chrome.com/extensions/storage#property-local
 */
Zotero.Prefs = Object.assign(Zotero.Prefs, {
	init: Zotero.Promise.method(function() {
		return this.migrate().then(function() {
			return new Zotero.Promise(resolve => chrome.storage.local.get(null, resolve));
		}.bind(this)).then(function(prefs) {
			this.syncStorage = prefs;
		}.bind(this));
	}),
	
	migrate: Zotero.Promise.method(function() {
		if (!localStorage.length) return;
		let prefs = Object.assign({}, localStorage);
		for (let k of Object.keys(prefs)) {
			if (k.substr(0, 'pref-'.length) == 'pref-') {
				prefs[k.substr('pref-'.length)] = JSON.parse(prefs[k]);
			}
			delete prefs[k];
		}
		return new Zotero.Promise(resolve => chrome.storage.local.set(prefs, resolve)).then(function() {
			return new Zotero.Promise(resolve => chrome.storage.local.set(
				{translatorMetadata: JSON.parse(localStorage['translatorMetadata'])}, resolve));
		}).then(function() {
			localStorage.clear();
		});
	}),
	
	set: function(pref, value) {
		Zotero.debug("Setting "+pref+" to "+JSON.stringify(value).substr(0, 100));
		let prefs = {};
		prefs[pref] = value;

		this.syncStorage[pref] = value;
		return new Zotero.Promise(function(resolve) {
			chrome.storage.local.set(prefs, resolve);
		});
	},

	clear: function(pref) {
		if (Array.isArray(pref)) return Zotero.Promise.all(pref.map((p) => this.clear(p)));
		delete this.syncStorage[pref];
		return new Zotero.Promise(function(resolve) {
			chrome.storage.local.remove(pref, resolve);
		});
	}
});
