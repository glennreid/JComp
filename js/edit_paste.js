
/*
 * 2/15/2023
 *
 * editUI.js
 *
 * Main user interface - data structures and interaction with DOM
 *
 */

var gPastingPlaceholder = "fetching link...";
var gPastedText = "";

// --------------------------------- functions ------------------------------

function XXcapitalize ( name )
{
	return name.charAt(0).toUpperCase() + name.slice(1);
}

function capitalize ( name )
{
  return name.replace(
    /\w*/g,
    function(txt) {
      return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();
    }
  );
}

var gEmailList = [];
var gUploadData = { 'fileID':0, 'batchID':0, 'total':0, 'first':0, 'page':35 };
var sAdded = { };
var sAlreadyCount = 0;
var sBadEmailCount = 0;

function parseEmailAddresses ( text )
{
	let recurseList = [];
	let commaList = text.split(',');
	if ( !empty(commaList) && commaList.length > 1 ) {
		for ( let idx = 0; idx < commaList.length; idx++ ) {
			let adds = parseEmailAddresses ( commaList[idx] );
			if ( !empty(adds) ) {
				for ( let jdx = 0; jdx < adds.length; jdx++ ) {
					recurseList.push ( adds[jdx] );
				}
			}
		}
		return recurseList;
	} else {
		let newlineList = text.split('\n');
		if ( !empty(newlineList) && newlineList.length > 1 ) {
			for ( let idx = 0; idx < newlineList.length; idx++ ) {
				let adds = parseEmailAddresses ( newlineList[idx] );
				if ( !empty(adds) ) {
					for ( let jdx = 0; jdx < adds.length; jdx++ ) {
						recurseList.push ( adds[jdx] );
					}
				}
			}
			return recurseList;
		} else {
			/*
			let spaceList = text.split(' ');
			if ( !empty(spaceList) && spaceList.length > 1 ) {
				for ( let idx = 0; idx < spaceList.length; idx++ ) {
					let adds = parseEmailAddresses ( spaceList[idx] );
					if ( !empty(adds) ) {
						for ( let jdx = 0; jdx < adds.length; jdx++ ) {
							recurseList.push ( adds[jdx] );
						}
					}
				}
				return recurseList;
			}
			*/
		}
	}
	let ptr = 0;
	let at = text.indexOf("@");
	let before = text.substring ( ptr, at ).trim();
	let after = text.substring ( at+1 );
	let left = before.indexOf("<");
	let right = after.indexOf(">");
	let name = "";
	let first = "";
	let last = "";
	let email = "";
	let zip = "";
	let add = { 'ck':0, 'first':"", 'last':"", 'email':"" };
	if ( left > 0 ) {
		name = before.substring ( 0, left-1 );
		if ( right > 0 ) {
			let beforeAt = text.substring ( left+1, at );
			let domain = after.substring ( 0, right );
			email = `${beforeAt}@${domain}`;
			name = name.replace ( '\n', '' );
			let startOfName = text.indexOf ( name );
			if ( startOfName > 0 ) { // skip extra shit at beginning of name text
				let words = name.split(' ');
				let len = words.length;
				if ( len > 1 ) {
					name = words[len-2] + " " + words[len-1];
				}
			}
			email = email.replace ( /[^@a-zA-Z0-9-_:\/\.]/g, '' );
			names = splitFullName ( name );
			first = capitalize ( names.first );
			last =  capitalize ( names.last );
			add = { 'ck':1, 'first':first, 'last':last, 'email':email };
		}
	} else {	// no RFC5322  < > notation
		if ( before.length && after.length ) {
			name = before;	// name@domain.com
			let domain = after;
			let comps = before.split('\t');		// look for CSV copy/paste delimited by tabs
			let cnt = comps.length;
			if ( cnt > 1 ) {
				let zipCol = identifyZipColumn ( comps );
				first = comps[0];
				last = comps[1];
				if ( zipCol >= 0 ) {
					zip = comps[zipCol].split('-')[0];
				}
				if ( (cnt-1) != zipCol ) {
					name = comps[cnt-1];
				}
				let words = first.split(' '); // parse spaces
				cnt = words.length;
				if ( cnt > 1 ) {
					first = words[0];
					last = "";
					for ( let kdx = 1; kdx < cnt; kdx++ ) {
						let lenLast = last.length;
						let word = words[kdx];
						if ( lenLast > 0 || kdx == cnt-1 ) {	// everything else is "last"
							if ( last.length > 0 ) last += ` `;
							last += `${word}`;	// "von der Hausen"
						} else {
							if ( word.length == 1 ) {
								if ( word == '+' || word == '&' ) nextToo = 1;
								first += ` ${word}`;
							} else if ( word.length == 2 && word.includes(".") ) {
								first += ` ${word}`;
							} else if ( nextToo ) {
								first += ` ${word}`;
								nextToo = 0;
							} else {
								last += capitalize ( word );
								nextToo = 0;
							}
						}
						/*
						name =  words[len-1];			// last non-space word
						last = "";
						for ( let kdx = 1; kdx < words.length-1; kdx++ ) {
							if ( words[kdx].length == 1 ) continue;		// ignore middle initial, &, +
							if ( kdx > 1 ) last += " ";
							last += capitalize ( words[kdx] );	// glenn von der hausen
						}
						*/
					}
					/*
					for ( let kdx = 1; kdx < words.length; kdx++ ) {
						if ( words[kdx].length == 1 ) continue;		// ignore middle initial
						if ( kdx > 1 ) last += " ";
						last += capitalize ( words[kdx] );	// glenn von der hausen
					}
					*/
				}
			} else {
				let words = before.split(' '); // parse spaces
				let cnt = words.length;
				let nextToo = 0;
				name = before; // unless parsed otherwise
				first = words[0];
				for ( let kdx = 1; kdx < cnt; kdx++ ) {
					let lenLast = last.length;
					let word = words[kdx];
					if ( lenLast > 0 || kdx == cnt-1 ) {	// everything else is "last"
						if ( last.length > 0 ) last += ` `;
						last += `${word}`;	// "von der Hausen"
					} else {
						if ( word.length == 1 ) {
							nextToo = 1;
							first += ` ${word}`;
						} else if ( word.length == 2 && word.includes(".") ) {
							nextToo = 1;
							first += ` ${word}`;
						} else if ( nextToo ) {
							first += ` ${word}`;
							nextToo = 0;
						} else {
							last += capitalize ( word );
							nextToo = 0;
						}
					}/*
					name =  words[len-1];			// last non-space word
					last = "";
					for ( let kdx = 1; kdx < words.length-1; kdx++ ) {
						if ( words[kdx].length == 1 ) continue;		// ignore middle initial, &, +
						if ( kdx > 1 ) last += " ";
						last += capitalize ( words[kdx] );	// glenn von der hausen
					}
					*/
				}
				let elems = name.split('.');	// look for glenn.reid
				if ( elems.length > 1 ) {
					first = elems[0];
					last = capitalize ( elems[1] );
					for ( let kdx = 2; kdx < elems.length; kdx++ ) {
						last += " ";
						last += capitalize ( elems[kdx] );		// glenn.von.der.hausen
					}
				}
			}
			comps = after.split('\t');		// look for CSV copy/paste delimited by tabs
			if ( comps.length > 0 ) {
				domain = comps[0];
				if ( comps.length > 1 ) {	// look for ZIP codes and maybe addresses
					let arg4 = comps[1];
					if ( parseInt(arg4) != 0 ) {
						zip = arg4.trim();
					}
				}
			}
			first = capitalize ( first );
			last =  capitalize ( last );
			email = `${name}@${domain}`;
			email = email.replace ( /[^@a-zA-Z0-9-_:\/\.]/g, '' );
			email = email.toLowerCase();
			add = { 'ck':1, 'first':first, 'last':last, 'email':email, 'zip':zip };
		}
	}
	if ( !empty(add.email) ) {
		if ( !(email in sAdded) ) {
			sAdded[email] = add;		// keep a list of those that we add
			recurseList.push ( add );
		} else {
			sAlreadyCount++;
		}
	}
	return recurseList;
}

function identifyZipColumn ( columns )
{
	let zipCol = -1;

	for ( let idx = 0; idx < columns.length; idx++ ) {
		let col = columns[idx];
		let comps = col.split('-');
		if ( comps.length > 2 ) {
			// phone number?!
		} else {
			let zip = parseInt ( comps[0] );
			if ( zip > 0 ) {
				if ( comps.length > 1 ) {
					if ( comps[1].length == 4 ) {	// zip+4 positive ID
					}
				}
				console.log ( `zip+4: ${col} --> ${zip}` );
				zipCol = idx;
				break;
			}
		}
	}
	return zipCol;
}

function insertAtCursor ( myField, myValue )
{
    if ( myField.selectionStart || myField.selectionStart == '0' ) {
        let startPos = myField.selectionStart;
        let endPos = myField.selectionEnd;
        myField.value = myField.value.substring(0, startPos)
            + myValue
            + myField.value.substring(endPos, myField.value.length);
    } else {
        myField.value += myValue;
    }
}

function processEmailAddressText ( text )
{
	let goodCount = 0;
	sAlreadyCount = 0;
	sBadEmailCount = 0;
	if ( text.includes("@") ) {
		let adds = parseEmailAddresses ( text );
		if ( !empty(adds) ) {
			goodCount = adds.length;
			for ( let idx = 0; idx < adds.length; idx++ ) {
				let addie = adds[idx];
				gEmailList.push ( addie );
			}
			insert_list_table();
		}
	}
	updateCounts ( goodCount );
	return goodCount;
}

function updateCounts ( goodCount )
{
	let textarea = $("#paste-email")[0];
	let data = gUploadData;
	let total = !empty(data) ? data.total : 0;
	let valid = !empty(data) ? data.valid : 0;
	let update = !empty(data) ? data.update : 0;
	let keep = !empty(data) ? data.keep : 0;
	let addNew = keep - update;
	let skipped = total - valid;
	//let already = sAlreadyCount + data.already;
	let already = data.already;

	if ( goodCount || total ) {
		let delta = gEmailList.length - goodCount;
		let more = (delta > 0) ? " more" : ""
		let plural = "es";
		if ( goodCount == 1 ) plural = "";
		let msg = `Got ${addNew}${more} valid address${plural} (see below)`;
		let summary = `${addNew} Addresses`;
		let caveats = ``;
		if ( already ) {
			msg += `, ${already} dupes`;
			if ( !empty(caveats) ) caveats += `, `;
			caveats += `${already} dupes`;
		}
		if ( data.update ) {
			msg += `, ${data.update} updates`;
			if ( !empty(caveats) ) caveats += `, `;
			caveats += `${data.update} updates`;
		}
		if ( data.bad ) {
			msg += `, ${data.bad} BAD emails of ${total} total.`;
			if ( !empty(caveats) ) caveats += `, `;
			caveats += `${data.bad} bad or missing`;
		}
		summary += ` (${caveats}) of ${total} total.`;
		msg += `.`;

		if ( delta ) {
			msg += `\nTotal of ${gEmailList.length} added...`;
		}
		if ( total > gEmailList.length && data.actual <= data.page ) {
			let sp1 = `<span class='green'>`, end = `</span>`;
			let remain = gUploadData.page;
			if ( total - gEmailList.length < remain ) {
				remain = total - gEmailList.length;
			}
			msg = `Displaying first ${gEmailList.length} of ${keep} addresses. `;
			summary = `Displaying first ${sp1}${gEmailList.length}${end} of ${keep} uploaded (${caveats}) of ${total} total). `;
			if ( !empty(data.keywords) ) {
				summary += `${sp1}${data.keywords}${end} tags.`;
			}
			if ( !empty(remain) ) {
				$("#b_more").html ( `Show ${remain} More` );
			}
			$("#b_more").show();
		} else {
			$("#b_more").hide();
		}
		msg += "\nPaste more addresses here (or drop CSV file)...";
		textarea.placeholder = msg;
		$("#paste_summary").html ( summary );
	} else if ( already ) {
		let msg = `You already added all ${sAlreadyCount} of those addresses.`;
		textarea.placeholder = msg;
	} else {
		let msg = `Got 0 valid addresses. Correct format:`;
		msg += sInstructions;
		textarea.placeholder = msg;
		//insertAtCursor ( textarea, text );
	}
	if ( gEmailList.length > 0 ) {
		$("#b_clear").show();
	} else {
		$("#b_clear").hide();
	}
	if ( typeof addedEmailCallback == "function" ) {
		addedEmailCallback ( goodCount );
	}
}

function addEmails()
{
	let textarea = $("#paste-email")[0];
	let text = textarea.value;
	let goodCount = processEmailAddressText ( text );
	if ( goodCount > 0 ) {
		textarea.value = "";	// clear text
	}
}

function clearEmails()
{
	clearLists();
}

function findEmail ( find )
{
	let found = null;

	if ( !empty(find) ) {
		for ( const rec of gGroup.members ) {
			if ( rec.email == find || rec.email2 == find ) {
				found = rec;
				break;
			}
		}
	}
	return found;
}

function pasteEmail ( event, textarea )
{
	if ( !empty(textarea.value) && textarea.value.length > 1 ) {
		console.log ( `Suppressing paste behavior because textarea has ${textarea.value.length} chars` );
	} else {
		let clipboard = event.clipboardData;
		let text = clipboard.getData('text');
		if ( text.includes("@") ) {
			event.preventDefault();
			processEmailAddressText ( text );
		} else {
			// maybe they're just editing the text and want to paste...
		}
	}
	//console.log ( text );
}

function processServerCSV ( decode, append=0 )
{
	let goodCount = 0, pageCount = 0, valid = 0, total = 0;
	sBadEmailCount = 0;
	sAlreadyCount = 0;

	// if somebody drops a CSV file, we don't add to the existing list, we replace it
	if ( empty(append) ) clearLists();

	if ( !empty(decode) ) {
		pageCount = decode.page;
		total = parseInt ( decode.total );
		valid = parseInt ( decode.valid );
		if ( empty(gUploadData.total) || total > gUploadData.total ) gUploadData.total = total;
		if ( empty(gUploadData.valid) || valid > gUploadData.valid ) gUploadData.valid = valid;
		gUploadData.valid = parseInt ( decode.valid );
		gUploadData.keep = parseInt ( decode.keep );
		gUploadData.already = parseInt ( decode.already );
		gUploadData.update = parseInt ( decode.update );
		gUploadData.actual = parseInt ( decode.actual );
		gUploadData.bad = parseInt ( decode.bad );
		gUploadData.first = parseInt ( decode.first );
		gUploadData.page = parseInt ( decode.page );
		gUploadData.keywords += parseInt ( decode.keywords );	// += cumulative
		gUploadData.lastRow = parseInt ( decode.lastRow );
		gUploadData.fileID = decode.fileID;
		gUploadData.batchID = decode.batchID;
		gUploadData.delimiter = decode.delimiter;
		sBadEmailCount = gUploadData.bad;
		processCSVData ( decode.data, append );
	}
	updateCounts ( pageCount );
}

function processCSVData ( data, append=0 )
{
	if ( !empty(data) ) {
		let adds = data;
		if ( adds.length > 0 ) {
			//clearLists();
			pageCount = adds.length;
			for ( let idx = 0; idx < adds.length; idx++ ) {
				let addie = adds[idx];
				let email = addie.email;
				let email2 = addie.email2;
				// do what with secondary email from Notes field?
				//if ( empty(email) ) email = addie.email2;
				addie.ck = 1;
				let existing = findEmail ( email );
				if ( existing && empty(gUpdateDuplicates) ) {
					sAlreadyCount++;
				} else {
					if ( empty(email) && empty(email2) ) {
						//
					} else if ( !empty(email) && !(email in sAdded) ) {
						sAdded[email] = addie;		// keep a list of those that we add
						gEmailList.push ( addie );
					} else if ( !empty(email2) && !(email2 in sAdded) ) {
						sAdded[email2] = addie;		// keep a list of those that we add
						gEmailList.push ( addie );
					} else {
						sAlreadyCount++;
					}
				}
			}
			sEmailDisplaySize = 200;
			insert_list_table ( append );
		}
	}
}

function have_field ( adds, field )
{
	let count = 0;
	for ( let idx = 0; idx < adds.length; idx++ ) {
		let addie = adds[idx];
		if ( !empty(addie[field]) ) count++;
	}
	return count;
}

var sEmailDisplaySize = 200;
var sEmailDisplayPage = 100;

function insert_list_table ( append=0 )
{
	let adds = gEmailList;
	let html = "";
	let zipCount = have_field ( adds, 'zip' ) + have_field ( adds, 'postal' );
	let haveCompany = have_field ( adds, 'company' );
	let haveEmail2 = have_field ( adds, 'email2' );
	let haveAddr1 = have_field ( adds, 'addr1' );
	let haveAddr2 = have_field ( adds, 'addr2' );
	let haveCity = have_field ( adds, 'city' );
	let haveState = have_field ( adds, 'state' );
	let haveCountry = have_field ( adds, 'country' );
	let haveLatLng = have_field ( adds, 'lat' );
	let haveNotes = have_field ( adds, 'notes' );
	let tagCount = have_field ( adds, 'tags' );
	if ( !empty(adds) ) {
		html += "<table>";
		html += "<thead>";
		html += "<td></td>";
		html += "<td class='hd rj'>#</td>";
		html += "<td class='hd rj'>First</td>";
		html += "<td class='hd lj'>Last</td>";
		html += "<td class='hd lj'>Email</td>\n";
		if ( haveEmail2 ) html += "<td class='hd hd lj'>Email 2</td>\n";
		if ( haveAddr1 ) html += "<td class='hd hd lj'>Address 1</td>\n";
		if ( haveAddr2 ) html += "<td class='hd hd lj'>Address 2</td>\n";
		if ( haveCity ) html += "<td class='hd lj'>City</td>\n";
		if ( haveState ) html += "<td class='hd lj'>State</td>\n";
		if ( zipCount ) html += "<td class='hd lj'>Zip</td>\n";
		if ( haveCountry ) html += "<td class='hd lj'>Country</td>\n";
		if ( haveLatLng ) html += "<td class='hd lj'>Latitude</td><td class='hd lj'>Longitude</td>\n";
		if ( tagCount ) html += "<td class='hd lj'>Tags</td>\n";
		if ( haveNotes ) html += "<td class='hd lj'>Notes</td>\n";
		html += "</thead>";
		let max = adds.length;
		if ( max > sEmailDisplaySize ) max = sEmailDisplaySize;
		for ( let idx = 0; idx < max; idx++ ) {
			let addie = adds[idx];
			let row = "<tr/>";
			// checkbox for selection
			row += `<td><input type='checkbox' checked onclick='checkRow(${idx});'`;
			row += ` class='echeck' idid='row-${idx}'></td>\n`;
			// recID
			row += `<td>${idx + 1}</td>`;
			// name fields
			if ( empty(addie.first) ) {
				row += `<td><input type='text' class='ebox rj' id='first-${idx}'`;
				row += " size=11 placeholder='First'";
				row += ` value='' /></td>\n`;
			} else {
				row += `<td><input type='text' class='ebox rj' id='first-${idx}'`;
				row += ` size=11 value="${addie.first}" /></td>\n`;
			}
			if ( empty(addie.last) ) {
				row += `<td><input type='text' class='ebox lj' id='last-${idx}'`;
				row += " size=13 placeholder='Last'";
				row += ` value='' /></td>\n`;
			} else {
				row += `<td><input type='text' class='ebox lj' id='last-${idx}'`;
				row += ` size=13 value="${addie.last}" /></td>\n`;
			}
			// email address
			if ( empty(addie.email) ) addie.email = '';
			if ( empty(addie.email2) ) addie.email2 = '';
			row += `<td><input type='text' class='ebox' id='email-${idx}'`;
				row += ` size=30 value="${addie.email}"</td>\n`;
			if ( haveEmail2 ) {
				row += `<td><input type='text' class='ebox' id='email2-${idx}'`;
				let val = empty(addie.email2) ? '' : addie.email2;
				row += ` size=24 value="${val}"</td>\n`;
			}
			if ( haveAddr1 ) {
				row += `<td><input type='text' class='ebox' id='addr1-${idx}'`;
				let val = empty(addie.addr1) ? '' : addie.addr1;
				row += ` size=24 value="${val}"</td>\n`;
			}
			if ( haveAddr2 ) {
				row += `<td><input type='text' class='ebox' id='addr2-${idx}'`;
				let val = empty(addie.addr2) ? '' : addie.addr2;
				row += ` size=24 value="${val}"</td>\n`;
			}
			if ( haveCity ) {
				row += `<td><input type='text' class='ebox' id='city-${idx}'`;
				let val = empty(addie.city) ? '' : addie.city;
				row += ` value="${val}"</td>\n`;
			}
			if ( haveState ) {
				row += `<td><input type='text' class='ebox' id='state-${idx}'`;
				let val = empty(addie.state) ? '' : addie.state;
				row += ` size=5 value="${val}"</td>\n`;
			}
			if ( zipCount ) {
				row += `<td><input type='text' class='ebox' id='zip-${idx}'`;
				let val = empty(addie.zip) ? '' : addie.zip;
				row += ` size=9 value="${val}"</td>\n`;
			}
			if ( haveCountry ) {
				row += `<td><input type='text' class='ebox' id='country-${idx}'`;
				let val = empty(addie.country) ? '' : addie.country;
				row += ` size=9 value="${val}"</td>\n`;
			}
			if ( haveLatLng ) {
				row += `<td><input type='text' class='ebox' id='lat-${idx}'`;
				let val = empty(addie.lat) ? '' : addie.lat;
				row += ` size=6 value="${val}"</td>\n`;
				row += `<td><input type='text' class='ebox' id='lng-${idx}'`;
				val = empty(addie.lng) ? '' : addie.lng;
				row += ` size=6 value="${val}"</td>\n`;
			}
			if ( tagCount ) {
				row += `<td><input type='text' class='ebox' id='tag-${idx}'`;
				let val = empty(addie.tags) ? '' : addie.tags;
				row += ` size=12 value="${val}"</td>\n`;
			}
			if ( haveNotes ) {
				row += `<td><input type='text' class='ebox' id='tag-${idx}'`;
				let val = empty(addie.notes) ? '' : addie.notes;
				row += ` size=48 value="${val}"</td>\n`;
			}
			html += row;
		}
		html += "</table>";
		if ( adds.length > max ) {
			let more = adds.length - max;
			if ( more > sEmailDisplayPage ) more = sEmailDisplayPage;
			html += "<div class='clickable headroom'";
				html += ` onclick='seeMoreImports();' >`;
					html += `<h4>[${more} More]</h4>\n`;
				html += "</a>";
			html += "</div>";
		}
	}
	$("#email_list").html ( html );
	$(".ebox").on( "keyup", function() {
		editEmailField ( this );
	});
	if ( typeof newMembersCallback === "function" ) {	// defined?
		newMembersCallback ( haveLatLng, append );
	}
}

function seeMoreImports ( )
{
	sEmailDisplaySize += sEmailDisplayPage;
	insert_list_table();
}

function pasteText ( event, textarea )
{
	let clipboard = event.clipboardData;
	let text = clipboard.getData('text');
	sCurrentTextArea = textarea;		// hack
	if ( text.includes("http") ) {
		let firstURL = extract_first_url ( text );
		gPastedText = text;
		if ( !empty(firstURL) ) {
			getPreviewDataFromServer ( textarea, firstURL );
			event.preventDefault();
			insertAtCursor ( textarea, gPastingPlaceholder );
		} else {
		}
	} else {
		// text is already in the textarea; this would duplicate it
		//insertAtCursor ( textarea, text );
	}
	//console.log ( text );
}

function getPreviewDataDirect ( textarea, pasteURL )
{
	let getURL = pasteURL;
	
	jQuery.ajax({
		url:getURL,
		dataType:'text/html',
		crossDomain: true,
		//headers: { 'Access-Control-Allow-Origin': 'https://zipit.social' },
		success:function(data) {	// should be full text of linked page
			gPasteMetadata = parseOGData ( data );
			updatePostMetadata ( textarea, data );
		},
		error: function(XMLHttpRequest, textStatus, errorThrown) {
			console.log('Error: ' + errorThrown + " / " + textStatus + pasteURL );
		}
	});

}

function getPreviewDataFromServer ( textarea, pasteURL )
{
	let getURL = `https://${gServer}/php/json_url_metatags.php?url=` + pasteURL;
	
	jQuery.ajax({
		url:getURL,
		dataType:'json',
		success:function(data) {
			gPasteMetadata = data;
			updatePostMetadata ( textarea, data );
		},
		error: function(XMLHttpRequest, textStatus, errorThrown) {
			console.log('Error: ' + errorThrown + " / " + textStatus + " json_url_metatags" );
		}
	});

}

function parseOGData ( page )
{
	let meta = strstr ( page, "og:" );
	let verbose = 0;
	let loops = 0;
	
	while ( !empty(meta) ) {
		let end = meta.indexOf ( '"' );
		if ( end > 15 ) end = meta.indexOf ( "'" );
		let tag = meta.substring ( 0, end );
		tag = substr ( tag, 3 );	// skip past "og:"
		if ( verbose ) console.log ( `META TAG ${tag}` );
		let start = meta.indexOf ( 'content=' );
		start += 8 + 1;		// 8 is strlen('content=')
		let content = meta.substring ( start );
		end = content.indexOf ( '"', 1 );
		if ( !end ) end = content.indexOf ( "'" );
		if ( !end ) end = 128;
		let value = content.substring ( 0, end );
		if ( verbose ) console.log ( `META VAL ${value}` );

		result[tag] = value;

		let remainder = substr ( content, end );
		meta = strstr ( remainder, "og:" );

		if ( loops++ > 60 ) break;
	}
}

// https://www.eventbrite.com/e/what-to-expect-when-youre-expecting-ai-at-work-tickets-590161748677

function updatePostMetadata ( textarea, data )
{
	let text = textarea.value;
	let replaceText = "";
	let siteName = get_domain_from_url ( gPastedText );

	if ( !empty(data) ) {
		let title = data.title;
		let url = gPost.url;
		let imageURL = data.image;
		let site = data.site_name;
		if ( !empty(data.url) ) {			// canonical URL returned from OG: data
			url = data.url;
			gPost.url = url;
		}
		gPost.imageURL = imageURL;
		if ( empty(imageURL) ) {
			replaceText = title;
		}
		gPost.caption = title;
		gPost.source = site;
		if ( !empty(imageURL) ) {
			refreshImageURL ( imageURL, url, "image from " + site );
		}
		replaceText = gPastedText;
	} else {
		//no!! gPost.url = gPastedText;
		//replaceText = `Link to ${siteName}`;
		//replaceText = gPastedText;
	}
	if ( gTextType == cPostType.LINK ) {
		gPost.url = gPastedText;
		//textarea.placeholder = "Got the link. Text added here will be ignored."
		replaceText = `Got the link at ${siteName}\n\nAdditional text added here will be ignored.`;
	} else {
		//replaceText = `Link to ${siteName}`;
		//textarea.placeholder = "add your thoughts...";
		replaceText = gPastedText;
	}
	if ( !empty(text) ) {	// insert title and site and stuff where placeholder is
		textarea.value = text.replace ( gPastingPlaceholder, replaceText );
	}
}

function addedEmailCallback ( goodCount )
{
	let idx = gEmailList.length;
	found = null;
	if ( idx > 0 ) {
		//idx--;
		while ( idx-- >= 0 ) {
			let recent = gEmailList[idx];
			if ( !empty(recent) && !empty(recent.first) ) {
				found = recent.first;
				break;
			}
		}
	}
	if ( found ) {
		let text = $("#example").html();
		if ( !empty(text) ) {
			text = text.replace ( gReplaceFirst, found );
			$("#example").html ( text );
			gReplaceFirst = found;		// for next time :)
		}
	}
}

function editArea ( item )
{
	let text = $("#paste-email").val();
	if ( text.length > 0 ) {
		$("#b_add_to_list").show();
	} else {
		$("#b_add_to_list").hide();
	}
}

function editEmailField ( item )
{
	let field = item.id;
	let comps = field.split('-');
	let which = comps[0];
	let row = comps[1];
	if ( !empty(gEmailList) ) {
		if ( which == 'first' ) gEmailList[row].first = item.value;
		if ( which == 'last' ) 	gEmailList[row].last = item.value;
		if ( which == 'email' ) gEmailList[row].email = item.value;
		if ( which == 'zip' ) gEmailList[row].zip = item.value;
		if ( which == 'tags' ) gEmailList[row].tags = item.value;
	}
}


var sInstructions =
"\n   (separate multiples with commas or each on a separate line)\
\n   First Last <user@email.com>\
\n   user1@email.com\
\n   user2@email.com, user3@gmail.com";

function setupForms ( postType )
{
	let textarea = $("#paste-email");
	if ( !empty(textarea) && !empty(textarea[0]) ) {
		let msg = `Paste addresses here to invite.`;
		msg += sInstructions;
		textarea[0].placeholder = msg;
	}
}

function checkRow ( idx )
{
	let adds = gEmailList;
	if ( !empty(adds) && idx < adds.length ) {
		adds[idx].ck = 1 - adds[idx].ck;	// toggle
	}
}

function editKeyEmail ( event, item )
{
	if (   event.code && event.code.includes('NumpadEnter')
		|| (event.which == 13 && event.shiftKey)
	) {
		addEmails();
		event.preventDefault();
	}
	let text = $("#paste-email").val();
	if ( text.length > 0 ) {
		$("#b_add_to_list").show();
	} else {
		$("#b_add_to_list").hide();
	}
	/*
	let shortName = $("#group_name");
	let pageName = $("#page_handle");
	let text = shortName.val().toLowerCase().replaceAll(" ","");
	//text = "https://zipit.social/me/" + text;
	text = encodeURI ( text );
	pageName.val ( text );
	*/
}

function editChange ( item )
{
	//gTemplateBody = item.value;
	//previewEditedTemplate ( false );
}

function addEmail()
{
}

function splitFullName ( fullname )
{
	// Muhammad Von der Hausen
	let rec = { };
	let parts = fullname.split ( " " );
	let len = parts.length;
	let first = parts[0];
	let last = "";
	for ( let idx = 1; idx < len; idx++ ) {
		if ( idx > 1 ) last += " ";
		last += parts[idx];	// "von der Hausen"
	}
	let result = { 'first':first, 'last':last };
	return result;
}

function clearLists()
{
	gEmailList = [];
	sAdded = { };
	gUploadData.fileID = 0;
	gUploadData.batchID = 0;
	gUploadData.total = 0;
	gUploadData.first = 0;
	gUploadData.page = 0;
	gUploadData.total = 0;
	gUploadData.keep = 0;
	gUploadData.update = 0;
	gUploadData.keywords = 0;
	sAlreadyCount = 0;
	if ( typeof clearMapPins === "function" ) clearMapPins();
	if ( typeof updateButtonTitle === "function" ) updateButtonTitle();
	$("#email_list").html ( "" );
	$("#paste_summary").html ( `No Addresses Collected` );
}

