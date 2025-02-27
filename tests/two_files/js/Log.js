/**
 * File: Util/Log.js
 * Creates a simple logger to help debug javascript. By default it will open a new
 * window so popup blocking may keep it from working. However, you can redirect the
 * log to a text area or a div if you wish.
 *
 * Copyright:
 * 	2005-2006 Rob Rohan (robrohan@gmail.com)
 */
// if(!Sortie.Util) Sortie.Util = {};


/**
 * Class: Log
 * Constructor for the logging window (or other std output if implemented)
 *
 * Namespace:
 * 	Sortie.Util
 */
const Log = function() {
	/**
	 * Variables: Log.NEW_WINDOW
	 * Basic log. Opens a new window and appends output to the new window
	 */
	this.NEW_WINDOW		= 0;
	/**
	 * Variables: Log.TEXT_AREA
	 * log to a text area
	 */
	this.TEXT_AREA 		= 1;

	/**
	 * Variables: Log.STRING_BUFFER
	 * log to a string (not implemented)
	 */
	this.STRING_BUFFER 	= 2;

	/**
	 * Variables: Log.CONSOLE
	 * Writes log output to the id defined as "neurostdout"
	 */
	this.CONSOLE	= 3;

	/**
	 * Variables: Log.USER_DIV
	 * Writes log output to the id defined as "neurolog"
	 */
	this.USER_DIV	= 4;

	/**
	 * Variable: Log.TYPE_DEBUG
	 * 	used within the class to tell what type of event
	 */
	this.TYPE_DEBUG = "DEBUG";
	/**
	 * Variable: Log.TYPE_WARN
	 * 	used within the class to tell what type of event
	 */
	this.TYPE_WARN  = "WARN";
	/**
	 * Variable: Log.TYPE_INFO
	 *	used within the class to tell what type of event
	 */
	this.TYPE_INFO  = "INFO";
	/**
	 * Variable: Log.TYPE_ERROR
	 * 	used within the class to tell what type of event
	 */
	this.TYPE_ERROR = "ERROR";

	this.running = false;

	this.textele_handle = null;

	this.logbuffer = "";

	this.type = this.NEW_WINDOW;

	/**
	 * Method: Log.Init
	 * Start up the log object and make sure any supporting items are created
	 * a new window for example. Will check the DEBUG flag and send
	 * any text to /dev/null if not in debug mode (i.e. DEBUG set to false)
	 */
	this.Init = function() {
		if(Sortie.DEBUG) {
			//there will be more of these at some point
			switch(this.type) {
				case this.NEW_WINDOW:
					this.__openwindow();
					break;
				case this.CONSOLE:
					this.__linkdiv();
					break;
				case this.USER_DIV:
					this.__linkinlinediv();
					break;
			}

			this.running = true;
			this.Info("Log (re)init...",this);
		}
	};

	/**
	 * Method: Log.Redirect
	 * Changes the output of the error log to go to the predefined area (see the Log
	 * constants). Often you'll want to set this before you run Init
	 *
	 * Parameters
	 * 	to - where to send the output (see the log constants)
	 *
	 * See Also:
	 * <Log.NEW_WINDOW>
	 * <Log.CONSOLE>
	 * <Log.USER_DIV>
	 * <Log.TEXT_AREA>
	 * <Log.STRING_BUFFER>
	 */
	this.Redirect = function(to) {
		this.type = to;
	};


	/*
	 * not an api call
	 */
	this.__linkdiv = function() {
		this.output_handle = window;
		this.textele_handle = document.getElementById("neurostdout");
	};

	/*
	 * not an api call
	 */
	this.__linkinlinediv = function() {
		this.output_handle = window;
		this.textele_handle = document.getElementById("neurolog");

		if(this.textele_handle == null || typeof this.textele_handle == "undefined") {
			alert("Warning: log set to output to a div with an id of 'neurolog', but no div was found. \n Log items will go nowhere.");
		}
	};

	/*
	 * not an api call
	 */
	this.__openwindow = function() {
		var wndptr = window.open(
			'',
			'Log_Viewer',
			'height=630,width=550,scrollbars=yes,resizable=yes,left=300,top=100,status=no,toolbar=no,location=no'
		);

		//write the main part of the page
		wndptr.document.open();
		wndptr.document.write('<html><head><style type="text/css">.error{ color: red; } .info{ color: navy; } .warn{ color: yellow; } .debug{ color: black; }</style></head><body style="margin: 1px;"></body></html>');
		wndptr.document.close();

		bdy = wndptr.document.getElementsByTagName("body");

		toolbarele = wndptr.document.createElement("div");
		toolbarele.setAttribute("id","LogToolBar");
		toolbarele.setAttribute("style","background-color: silver; padding: 0px; margin: 0px; width: 100%; top: 0px; position: fixed !important; position: absolute; white-space: nowrap;	z-Index: 1000000;");
		toolbarele.innerHTML="<input type='button' value='Clear' onclick='document.getElementById(\"LogText\").innerHTML=\"\";' title='Clear'>";

		logtextele = wndptr.document.createElement("div");
		logtextele.setAttribute("id","LogText");
		logtextele.setAttribute("style","top: 22px; width: 100%; height: 96%; position: relative;");

		bdy.item(0).appendChild(toolbarele);
		bdy.item(0).appendChild(logtextele);

		this.textele_handle = logtextele;
		this.output_handle = wndptr;
	};

	/*
	 * not an api call
	 */
	this.__write = function(type, object, line)
	{
		//do nothing if the log was not started
		if(this.running == false) return;

		if(typeof object == "undefined") object = "NO OBJECT";

		if(this.type == this.NEW_WINDOW) {
			if(!this.output_handle.document) {
				this.__openwindow();
			}
		}

		var date = new Date();
		var datestring = (date.getYear() < 1900) ? date.getYear()+1900  : date.getYear();
			datestring += "-" + (date.getMonth() + 1)
			datestring += "-" + date.getDate();
			datestring += " "
				+ date.getHours() + ":"
				+ ((date.getMinutes() >= 10) ? date.getMinutes() : "0" + date.getMinutes()) + ":"
				+ ((date.getSeconds() >= 10) ? date.getSeconds() : "0" + date.getSeconds());

		var newline = null;

		if(this.output_handle != null)
			newline = this.output_handle.document.createElement("div");
		else
			newline = document.createElement("div");

		switch(type) {
			case this.TYPE_DEBUG:
				newline.setAttribute("class","debug");
				break;
			case this.TYPE_INFO:
				newline.setAttribute("class","info");
				break;
			case this.TYPE_WARN:
				newline.setAttribute("class","warn");
				break;
			case this.TYPE_ERROR:
				newline.setAttribute("class","error");
				break;
		}
		newline.innerHTML =	"[" + datestring + "] " + type + " :: " + (typeof object) + " :: " + line;
		this.textele_handle.appendChild(newline);
		this.output_handle.scrollTo(0,this.textele_handle.scrollHeight);
	};

	/**
	 * Method: Log.Debug
	 * Write a debug line to the log
	 *
	 * Parameters:
	 * 	line - the text for the log
	 * 	object - (optional) the object this line is from "NO OBJECT" default
	*/
	this.Debug = function(line, object) {
		this.__write(this.TYPE_DEBUG, object, line);
	};

	/**
	 * Method: Log.Info
	 * Write an info line to the log
	 *
	 * Parameters:
	 * 	line - the text for the log
	 * 	object - (optional) the object this line is from "NO OBJECT" default
	*/
	this.Info = function(line, object) {
		this.__write(this.TYPE_INFO, object, line);
	};

	/**
	 * Method: Log.Warn
	 * Write a warn line to the log
	 *
	 * Parameter:
	 * 	line - the text for the log
	 * 	object - (optional) the object this line is from "NO OBJECT" default
	 */
	this.Warn = function(line, object) {
		this.__write(this.TYPE_WARN, object, line);
	};

	/**
	 * Method: Log.error
	 * Write an error line to the log
	 * Parameter:
	 * 	line - the text for the log
	 * 	object - (optional) the object this line is from "NO OBJECT" default
	 *
	 */
	this.Error = function(line, object) {
		this.__write(this.TYPE_ERROR, object, line);
	};
}

/////////////////////META DATA //////////////////////////////////////////////
/**
 * Variable: Sortie.Util.Log.VERSION
 * 	the current version
 */
// Sortie.Util.Log["VERSION"] = "0.2";
///////////////////////////////////////////////////////////////////////////

export default Log;
