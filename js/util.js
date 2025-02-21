
/*
 * 8/8/2017
 * 2/26/2023
 *
 * util.js
 *
 * Functions to do what Javascript should already know how to do
 */

function empty ( val )
{
	var objectType = typeof(val);
	
    // test results
    //---------------
    // []        true, empty array
    // {}        true, empty object
    // null      true
    // undefined true
    // ""        true, empty string
    // ''        true, empty string
    // 0         false, number
    // true      false, boolean
    // false     false, boolean
    // Date      false
    // function  false

    if (val === undefined)
		return true;
	
    if (val == null)
        return true;

	if ( objectType == "array" && val.length === 0 )       // null or 0 length array
		return true;
	
	if ( objectType == "string" ) {
		if ( val.length === 0 ) return true;      // null or 0 length string
		if ( val == "0" ) return true;
		if ( val == "0000-00-00 00:00:00" ) return true;
	}

    if ( objectType == "object" ) {
        // empty object unless we find a valid key
        let mt = true;
        for (const f in val) { mt = false; break; }
        return mt;
    }

	if ( objectType == "number" ) {
		if ( val == 0 )	return true;			// 0 numbers are "empty" like PHP
		if ( isNaN(val) ) return true;
	}

    if ( objectType == 'function' || objectType == 'boolean' )
        return false;
        
	if ( Object.prototype.toString.call(val) === '[object Date]' ) {
		var timeTest = val.getTime();
		if ( isNaN(timeTest) ) return true;
		return false;
	}

    return false;
}

function encode_params ( uid, pid, gid, type="" )
{
	var code = btoa ( `${uid} ${pid} ${gid} ${type}` );
	code = code.replaceAll ( "=", "" );
	return code;
}

function decode_params ( code )
{
	var dict = {};
	var str = atob(code).trim();
	var comps = str.split(" ");
	dict['uid'] = comps[0];
	dict['pid'] = comps[1];
	dict['gid'] = comps[2];
	dict['when'] = comps[3];

	return dict;
}

function contains_url ( text )
{
	var result = false;

	var loc = text.indexOf ( "http" );
	if ( loc >= 0 ) result = true;

	return result;
}

function extract_first_url ( text )
{
	var url = text;
	var ptr = text;
	var loc = ptr.indexOf ( "http" );
	if ( loc >= 0 ) {
		var next = ptr.substring(loc);
		var slashes = next.indexOf("//");
		if ( slashes ) {
			var end = 0;
			url = next; // .substring ( slashes+2 );
			//const regex = "[^\/]";
			var found = url.match(/[^A-Za-z0-9:\.\/\?=&\-_+*%\'\(\)]/);
			if ( !empty(found) && !empty(found[0]) ) {
				var end = url.indexOf ( found[0] );
				url = url.substring ( 0, end );
				// if we want to get all the URLs, loop like replace_urls and do this:
				//loc += url.length;
				//ptr = ptr.substring ( loc );
			}
		}
	}
	return url;
}

function replace_urls ( text )
{
	var tries = 0;
	var ptr = text;
	var result = (' ' + text).slice(1);

	while ( tries++ < 10 ) {
		var loc = ptr.indexOf ( "http" );
		if ( loc >= 0 ) {
			var next = ptr.substring(loc);
			var slashes = next.indexOf("//");
			if ( slashes ) {
				var url = next; // .substring ( slashes+2 );
				var end = url.length;
				//const regex = "[^\/]";
				var found = url.match(/[^A-Za-z0-9:\.\/\?=&\-_+*%\'\(\)]/);
				var target = " target='_zipexternal'";
				if ( !empty(found) && !empty(found[0]) ) {
					end = url.indexOf ( found[0] );
				}
				url = url.substring ( 0, end );
				var domain = get_domain_from_url ( url );
				var replace = `Link to ${domain}`;
				if ( domain == 'zipit.social' ) {
					target = "";		// not an external link
					replace += ` page`;
				}
				var link = `<a href='${url}'${target}>` + replace + "</a>";
				result = result.replace ( url, link );
				loc += url.length;
				ptr = ptr.substring ( loc );
			}
		} else break;
	}
	/*
	if ( wordArray.length > 1 ) {
		for ( var idx = 0; idx < wordArray.length; idx++ ) {
			var word = wordArray[idx];
			var beginning = word.substring(0,24);
			if ( beginning.includes("https://") || beginning.includes("http://") ) {
				var link = word;
				var start = word.indexOf ( "http" );
				if ( start > 0 ) link = word.substring ( start );
				var replace = word;

				replace = `${splitChar}Link to ` + get_domain_from_url ( word );
				var url = "<a href='" + link + "' target='_zipexternal'>" + replace + "</a>";
				result = result.replace ( word, url ) + splitChar;
			}
		}
	*/
	return result;
}


function replace_urls_split ( text, splitChar )
{
	var wordArray = text.split ( splitChar );
	result = text;

	for ( var idx = 0; idx < wordArray.length; idx++ ) {
		var word = wordArray[idx];
		var beginning = word.substring(0,24);
		if ( beginning.includes("https://") || beginning.includes("http://") ) {
			var link = word;
			var start = word.indexOf ( "http" );
			if ( start > 0 ) link = word.substring ( start );
			var replace = word;
			/*
			if ( word.length > 32 ) {
				replace = word.substring(0,32) + "...";
				//replace = replace.replace(/[^a-zA-Z0-9-_:\/\.]/g, '');
			}
			// get rid of any trailing characters like ) or ] or whatever:
			link = link.replace(/[^a-zA-Z0-9-_:\/\.]/g, '');
			*/
			replace = `${splitChar}Link to ` + get_domain_from_url ( word );
			var url = "<a href='" + link + "' target='_zipexternal'>" + replace + "</a>";
			result = result.replace ( word, url ) + splitChar;
		}
	}
	return result;
}


function get_domain_from_url ( url )
{
	var title = url;

	var comps = title.split("//");
	if ( comps.length > 1 ) title = comps[1];
	comps = title.split("/");
	if ( comps.length > 1 ) title = comps[0];
	comps = title.split("?");
	if ( comps.length > 1 ) title = comps[0];

	/* older code just in case it's better
		var comps = gPastedText.split('?');
		if ( comps.length > 1 ) siteName = comps[0];	// lose the args after ?
		var slashes = siteName.indexOf("//");	// get rid of https:// at beginning of siteName
		if ( slashes > 0 ) siteName = siteName.substring(slashes+2);
		var slash = siteName.indexOf("/");	// get rid of /rewrite/rules/
		if ( slashes > 0 ) siteName = siteName.substring(0,slash);
	*/
	return title;
}

// replace \n with <br/>\n
function html_paragraph ( text )
{
	var para = "";
	if ( !empty(text) ) {
		var body = text.replaceAll ( "\r\n", "\n" );
		body = body.replaceAll ( "\n\n", "XNX</p>XNX<p class='pp'>" );
		body = body.replaceAll ( "\n", "<br/>\n" );
		var len = body.length;
		var last4 = body.substring ( len-3 );
		if ( last4 == "</p>" ) { 	// strip the final </p>
			body = body.substring ( 0, len-3 );
		}
		para = "<p class='pp'>\n" + body + "\n</p>";
		//para = para.replaceAll ( "<p>", "<p class='pp'>" );
		para = para.replaceAll ( "XNX", "\n" );
	}
	return para;
}

function makeReadMore ( text, postID, maxLinesParam=14, maxParagraphsParam=3 )
{
	var result = text;
	var paragraphs = text.split("</p>");
	var paraCount = paragraphs.length;
	var paraCutoff = 0;
	var maxLines = maxLinesParam ? maxLinesParam : 12;
	var maxParagraphs = maxParagraphsParam;

	if ( paraCount > 2 ) {
		var idx = 0;
		var before = "";
		var after = "";
		var beforePPs = 0;
		var charCount = 0;
		var lineCount = 0;
		
		for ( idx = 0; idx < paraCount; idx++ ) {
			var pp = paragraphs[idx];
			before += `${pp}</p>`;
			charCount += pp.length;
			if ( charCount > 65 ) {		// about 65 chars to a line
				var lines = Math.floor ( charCount / 65 );
				lineCount += lines;  charCount = 0;
			}
			lineCount++;	// for the space between paragraphs
			if ( lineCount > maxLines ) break;
			if ( idx >= (maxParagraphs-1) ) break;
		}
		paraCutoff = idx + 1;
		if ( paraCutoff < paraCount ) {
			var linesToGo = 0;
			for ( jdx = paraCutoff; jdx < paraCount; jdx++ ) {
				var pp = paragraphs[jdx];
				linesToGo += Math.floor ( pp.length / 65 );
			}
			if ( linesToGo > 2 ) {
				for ( jdx = paraCutoff; jdx < paraCount; jdx++ ) {
					var pp = paragraphs[jdx];
					after += `${pp}`;
					if ( jdx < paraCount-1 ) after += "</p>";		// all but the last...
				}
				if ( text != `${before}${after}` ) {
					console.log ( "text != $before$after" );
					var bp = 1;	// bug!
				}
				if ( !empty(after) ) {
					more = `<span id='more-${postID}' onclick='showMore(this,${postID});' class='more_butt'>[Show More]</span>`;
					after = `<span hidden id='after-${postID}'>${after}</span>`;
					result = `${before}${more}${after}`;
				}
			}
		}
	} else {
		var textCount = text.length;
		if ( textCount > 500 ) {
		}
	}
	return result;
}

function showMore ( obj, postID )
{
	var moreJQ = $(`#more-${postID}`);
	var afterJQ = $(`#after-${postID}`);
	var visible = afterJQ.is(":visible");
	if ( visible ) {
		moreJQ.html ( "[Show More]" );
		afterJQ.hide();
	} else {
		moreJQ.html ( "[Hide More]" );
		afterJQ.show();
	}
}

function dollar_string ( val )
{
	//var result = "$";
	//var money = val.toFixed(2);
	//result += money;
	var formatter = new Intl.NumberFormat('en-US', {
	  style: 'currency',
	  currency: 'USD',
	  minimumFractionDigits: 2,
	});

	var money = formatter.format(val); /* $2,500.00 */
	return money;
}

function commas ( x )
{
    return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function is_mobile()
{
	return ( window.innerWidth < 800 ) ? 1 : 0;
}

function is_narrow()
{
	return ( window.innerWidth < 1200 ) ? 1 : 0;
}

function setCookie ( key, value, days )
{
    var expires = "";
    if (days) {
        var date = new Date();
        date.setTime(date.getTime() + (days*24*60*60*1000));
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = key + "=" + (value || "")  + expires + "; path=/";
}

function getCookie ( key )
{
    var nameEQ = key + "=";
    var ca = document.cookie.split(';');
    for(var i=0;i < ca.length;i++) {
        var c = ca[i];
        while (c.charAt(0)==' ') c = c.substring(1,c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
    }
    return null;
}

function deleteCookie ( key )
{
    document.cookie = key +'=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
}
