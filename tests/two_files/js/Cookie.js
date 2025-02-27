/**
 * File: Util/Cookie.js
 * Simple functions to get and set cookie information
 *
 * Copyright:
 * 	2004-2006 Rob Rohan robrohan@gmail.com All rights reserved
 */
// if(!Sortie.Util) Sortie.Util = {};

/**
 * Class: Cookie
 * Cookie access and manipulation class
 *
 * Namespace:
 * 	Sortie.Util
 */
const Cookie = function() {
	/**
	 * Method: Cookie.GetCookie
	 * gets a value from the current cookie
	 *
	 * Parameters:
	 * 	name - the name of the key in the cookie
	 *
	 * Returns:
	 * 	the cookies value
	 */
	this.GetCookie = function(name) {
		var start = document.cookie.indexOf(name+"=");
		var len = start+name.length+1;

		if ((!start) && (name != document.cookie.substring(0,name.length)))
			return null;

		if (start == -1)
			return null;

		var end = document.cookie.indexOf(";",len);

		if (end == -1) end = document.cookie.length;

		return unescape(document.cookie.substring(len,end));
	};


	/**
	 * Method: Cookie.SetCookie
	 * sets a value in a cookie
	 *
	 * Parameters:
	 * 	name - the name
	 * 	value - the value
	 * 	expires - (optional) date of expires
	 * 	path - (optional)
	 * 	domain - (optional)
	 * 	secure - (optional)
	 */
	this.SetCookie = function(name, value, expires, path, domain, secure) {
		this.SetRawCookie(
			name + "=" +escape(value) +
			( (expires) ? ";expires=" + expires.toGMTString() : "") +
			( (path) ? ";path=" + path : "") +
			( (domain) ? ";domain=" + domain : "") +
			( (secure) ? ";secure" : "")
		);
	};

	/**
	 * Method: Cookie.RemoveCookie
	 * Removes a cookie (sets the expires to the past really)
	 *
	 * Parameters:
	 * 	name - the name
	 * 	path - (optional)
	 * 	domain - (optional)
	 * 	secure - (optional)
	 */
	this.RemoveCookie = function(name, path, domain, secure) {
		var thepast = new Date();
		thepast.setYear(thepast.getYear() - 2);

		this.SetCookie(name, "", thepast, path, domain, secure);
	};

	/**
	 * Method: Cookie.SetPermCookie
	 * sets a cookie that will last 20 years
	 *
	 * Parameters:
	 * 	name - the name
	 *	value - the value of the cookie
	 * 	path - (optional)
	 * 	domain - (optional)
	 * 	secure - (optional)
	 */
	this.SetPermCookie = function(name, value, path, domain, secure) {
		var thefuture = new Date();
		var year = (thefuture.getYear() < 1000) ? thefuture.getYear() + 1900 : thefuture.getYear();
		thefuture.setYear(year + 5);
		this.SetCookie(name, value, thefuture, path, domain, secure);
	};

	/**
	 * Method: Cookie.SetRawCookie
	 * Sets the preformatted string to the cookie
	 *
	 * Parameters:
	 * 	cookie - the raw cookie string
	 */
	this.SetRawCookie = function(cookie) {
		document.cookie = cookie;
	};
}

/////////////////////META DATA //////////////////////////////////////////////
/**
 * Variable: Sortie.Util.Cookie.VERSION
 * 	the current version
 */
// Sortie.Util.Cookie["VERSION"] = "0.5";
///////////////////////////////////////////////////////////////////////////

export default Cookie;
