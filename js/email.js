
/*
 * ZIPit
 *
 * 6/25/2023
 *
 * compose.js
 *
 * Rich HTML email support
 */

const JUST_SAVED = 1;
const JUST_SENT = 1;
const REDRAW = 1;
const NO_REDRAW = 0;

// quick comment test

function buildMessageLink ( idx )
{
	let result = "";
	if ( gMessageList && idx >= 0 ) {
		let currMsg = gMessageList[idx];
		if ( currMsg ) {
			let messageID = currMsg.messageID;
			let id = "msg-list-" + idx;
			let value = "";
			let count = gMessageList.length - 1;
			let lastID = gMessageList[count].messageID;

			value += (idx+1) + " of " + (count+1);
			result += "<span class='clickable' data-jq-dropdown='#msg-list-popup'";
		//	result += "<span class='clickable' data-jq-dropdown='#tag-list-" + userID + "'";
			result += " id='" + id + "'>" + value + "</span>";
		}
	}
	return result;
}

function invokeMsgListItem ( field, event, label )
{
	let messageID = gListClickedMsgID;
	let incoming = event.currentTarget.id;
	let parts = incoming.split("-");
	let labelInList = "#msg-list-" + messageID;
	let which = parts[3];
	let offset = which - gMessageIdx;

	changeMessage ( offset );
	buildMessageDropDown ( );
}

function buildMessageDropDown ( )
{
	let result = "";
	let id = "msg-list-";
	let value = "";
	let html = "";

	html += "<ul class='jq-dropdown-menu'>";

	for ( let idx in gMessageList ) {
		let message = gMessageList[idx];
		let subject = message['subject'];
		let date = `Not yet sent`;
		if ( !empty(message['firstSent']) ) {
			date = `sent ` + message['firstSent'].substring(0,10);
		} else {
			date = `edited ` + message['modified'].substring(0,10);
		}
		let inner = `<li><a href='#1' class='msg-list-item' id='msg-list-item-${idx}'>`;
		if ( idx == gMessageIdx ) {
			//inner += '&#9745; &nbsp;';
			inner += '&#x2714; &nbsp;';
		}
		inner += (idx+1) + ` - ${subject}`;
		inner += ` [${date}]`;
		inner += "</a>";
		inner += "</li>";
		html += inner;
	}
	html += "</ul>";
	// update the contents of the user-specific dropdown (shows their tags as checked)
	//let listID = "#tag-list-" + userID;
	let listID = "#msg-list-popup";
	let item = $(listID);
	item.html ( html );

	$(".msg-list-item").click(function(event) {
		invokeMsgListItem ( $(this), event, "msgListItem" );
	});
}

function makeCheckBox ( userID, value, which )
{
	let user = gUsers[userID];
	let flag = parseInt(user[which]);
	let checked = "";
	if ( !empty(flag) && flag > 0 ) checked = " checked";
	let result = "<input type='checkbox' name='" + userID + "' value='" + flag + "' onclick='optCheck(" + usrID + ", \"" + which + "\");'" + checked + ">";
	return result;
}

function doQuillSetup()
{
	let toolbarOptions = [
		['bold', 'italic', 'underline', 'strike'],        // toggled buttons
		['blockquote', 'code-block'],

		[{ 'container': '#toolbar'}],
		[{ 'header': 1 }, { 'header': 2 }],               // custom button values
		[{ 'list': 'ordered'}, { 'list': 'bullet' }],
		[{ 'script': 'sub'}, { 'script': 'super' }],      // superscript/subscript
		[{ 'indent': '-1'}, { 'indent': '+1' }],          // outdent/indent
		[{ 'direction': 'rtl' }],                         // text direction

		['link', 'image'],

		[{ 'size': ['small', false, 'large', 'huge'] }],  // custom dropdown
		[{ 'header': [1, 2, 3, 4, 5, 6, false] }],

		[{ 'color': [] }, { 'background': [] }],          // dropdown with defaults from theme
		[{ 'font': [] }],
		[{ 'align': [] }],

		['clean']                                         // remove formatting button
	];
	gQuill = new Quill('#editor', {
    	theme: 'snow',
		modules: {
			toolbar: '#toolbar', // toolbarOptions,
			imageResize: {
          		displaySize: true
        	}
		}
	});
	gQuill.on('text-change', function(delta, oldDelta, source) {
		if (source == 'api') {
			console.log("An API call triggered this change.");
		} else if (source == 'user') {
			//console.log("A user action triggered this change.");
		}
		if ( gBodyReplaced ) {
			// no need to save it, as we just fetched it
			console.log ( "suppressing editChange because gBodyReplaced" );
			gBodyReplaced = 0;
		} else {
			editChange ( gTemplateBody );
		}
	});
    // quill editor add image handler
    gQuill.getModule('toolbar').addHandler('image', () => {
      selectLocalImage();
    });

}

function selectLocalImage()
{
	const input = document.createElement('input');
	input.setAttribute('type', 'file');
	input.click();

	// Listen upload local image and save to server
	input.onchange = () => {
		let files = input.files;
		let total = files.length;
		let goodCount = 0;
		for ( let idx = 0; idx < files.length; idx++ ) {
			let fd = new FormData();
			let fileName = files[idx].name;
			let comps = fileName.split(".");
			let len = comps.length;
			let ext = comps[len-1];
			let type = "EMAIL_EMBED";
			if ( is_video(ext) ) {
				vidCount++;
			} else {
				let batch = 0;

				fd.append ( 'file', files[idx] );

				console.log ( "email/add uploaded file: " + fileName );

				//let status = new createStatusbar ( type, progressJQ ); //Using this we can set progress.
				//status.setFileNameSize ( fileName, files[idx].size );
			//	sendFileToServer ( idx, total, gUID, gGroupOfInterestID, batch, type, fd, fileName, null, null, null );
				saveImageToServer ( type, fd, fileName );
				goodCount++;
			}
		}
		/*
		const file = input.files[0];

		// file type is only image.
		//if (/^image\//.test(file.type)) {
		if ( file.type == 'image/jpeg' ) {
		  saveImageToServer ( file );
		} else {
		  console.warn('You could only upload images.');
		}
		*/
	};
}

function saveImageToServer ( type, formData, fileName )
{
    let uploadURL = "https://files.zipit.social/php/file_upload.php"; //Upload URL for image files
    let extraData ={}; //Extra Data.
	let sep = '?';

	uploadURL += sep + "idx=0&batch=0&total=1"; sep = '&';
	uploadURL += sep + "file=" + fileName; sep = '&';

    uploadURL += sep + "uid=" + gUID; sep = '&';
    uploadURL += sep + "gid=" + gGroupOfInterestID; sep = '&';
    if ( !empty(type) ) uploadURL += sep + "type=" + type; sep = '&';


    let fileUploadProcess = $.ajax({
            xhr: function() {
            let xhrobj = $.ajaxSettings.xhr();
			if ( xhrobj.upload ) {
				/*
				xhrobj.upload.addEventListener('progress', function(event) {
					let percent = 0;
					let position = event.loaded || event.position;
					let total = event.total;
					if (event.lengthComputable) {
						percent = Math.ceil(position / total * 100);
					}
					//Set progress
					statusbar.setProgress(percent);
					if ( percent == 100 ) {
						//uploadPostProcess ( type, fileName, statusbar, imageJQ, zoneJQ );
					}
				}, false);
				*/
			}
            return xhrobj;
        },
        url: uploadURL,
        type: "POST",
		dataType: "text",
        contentType: false,
        processData: false,
        cache: false,
        data: formData,
        success: function(data) {
			let comps = data.split("\t");
			if ( comps.length <= 1 ) {
				alert ( "Bad return from server: " + data );
			} else {
				let filename = comps[1];
				comps = filename.split("-");
				let imageID = comps[1].split(".")[0];
				let imageURL = `https://${gServer}/embed/${imageID}`;
				insertToEditor ( imageURL );
			}
        },
		error: function(XMLHttpRequest, textStatus, errorThrown) {
			console.log('Error: ' + errorThrown + " / " + textStatus + " send_post" );
		}
    });

}

function insertToEditor ( url )
{
	// push image url to rich editor.
	const range = gQuill.getSelection();
	gQuill.insertEmbed(range.index, 'image', url);
	gQuill.formatText(range.index, 1, 'width', '100%');
	//previewEditedTemplate ( false );
}

function saveEdit ( andSend=0 )
{
	if ( !gBodyChanged && !andSend ) {
		console.log ( "saveEdit: no changes to save" );
	}
	let getUrl = `https://${gServer}/php/save_email_body.php`;
	let sep = '?';
	let userID = 0;
	let text = ( gQuill ? gQuill.root.innerHTML : "" );
	let text2 = $("#editor").html();
	let package = {
		'emailID': gEmailID, 'ownerID': gUID, 'groupID': gGroupOfInterestID,
		'fromName': gEmailRec.fromName, 'fromEmail': gEmailRec.fromEmail,
		'theme': gEmailRec.theme,
		'sleepers': gSleepers,
		'subject': gEmailRec.subject, 'body': text,
	}
	let json = JSON.stringify( package );
	json = encodeURIComponent ( json );
	gBodyChanged = 0;
	if ( gEmailID == 0 ) {
		let bp = 1;
	}

	jQuery.ajax({
		url:getUrl,
		type: 'POST',
		dataType:'text',
		data: json,
		success:function(data) {
			let newID = parseInt ( data );
			if ( gEmailID != newID ) {
				gEmailID = newID;
				getEmailHistoryFromServer ( newID );
				updateEmailUI ( gEmailID, REDRAW, JUST_SAVED );
			} else {
				updateEmailUI ( gEmailID, NO_REDRAW, JUST_SAVED );
			}
			console.log ( `saved emailID ${gEmailID}` );
			// save locally
			if ( empty(gMessageList[gMessageIdx]) ) {
				package.emailID = newID;
				gMessageList[gMessageIdx] = package;
			} else {
				gMessageList[gMessageIdx].emailID = newID;
			}
			if ( andSend ) {
				sendNewsletter ( gEmailID );
			}
		},
		error: function(XMLHttpRequest, textStatus, errorThrown) {
			console.log('Error: ' + errorThrown + " / " + textStatus + " save_email_body" );
		}
	});
}

function sendNewsletter ( emailID )
{
	let getUrl = `https://${gServer}/php/send_email_newsletter.php`;
	let sep = '?';
	let userID = 0;
	let package = {
		'emailID': emailID, 'ownerID': gUID, 'groupID': gGroupOfInterestID,
		//'list': gSelected,
	}
	let sendList = [];
	for ( let key in gSelected ) {	// only selected people
		if ( gSelected[key] ) sendList.push ( key );
	}
	if ( empty(sendList) ) {
		alert ( "Nobody is selected to receive the email" );
		return;
	}
	package['list'] = sendList;
	let rec = findEmailFromID ( emailID );
	if ( !empty(rec) ) {
		rec.recipients = sendList.length;
		package['emailRec'] = rec;
	}
	let json = JSON.stringify( package );
	json = encodeURIComponent ( json );

    getUrl += sep + "uid=" + gUID; sep = '&';
    getUrl += sep + "gid=" + gGroupOfInterestID; sep = '&';
    getUrl += sep + "eid=" + emailID; sep = '&';

	jQuery.ajax({
		url:getUrl,
		type: 'POST',
		dataType:'text',
		data: json,
		success:function(data) {
			gEmailID = parseInt ( data );
			updateEmailUI ( gEmailID, NO_REDRAW, JUST_SAVED, JUST_SENT );
			console.log ( `sent emailID ${gEmailID}` );
		},
		error: function(XMLHttpRequest, textStatus, errorThrown) {
			console.log('Error: ' + errorThrown + " / " + textStatus + " send_email_newsletter" );
		}
	});
}

function deleteMessageOnServer ( messageID )
{
	let getUrl = `https://${gServer}/php/delete_email_body.php`;
	let sep = '?';

	getUrl += sep + `mid=${messageID}`; sep = '&';

	jQuery.ajax({
		url:getUrl,
		type: 'GET',
		dataType:'text',
		success:function(data) {
			console.log ( `deleted emailID ${messageID}` );
		},
		error: function(XMLHttpRequest, textStatus, errorThrown) {
			console.log('Error: ' + errorThrown + " / " + textStatus + " delete_email_body" );
		}
	});
}


function memberHasTag ( tagName )
{
}

function markTaggedMembers ( )
{
	let count = 0;
	let list = gGroup.members;
	let yesList = listOfTagsChecked ( 'yes' );
	let yesTagCount = numberTagsChecked ( 'yes' );
	let noTagCount = numberTagsChecked ( 'no' );
	let matchAllTags = gOptions['match_all'].state;

	if ( !yesTagCount && !noTagCount && empty(gSearch) ) return;

	// go through Green groups and exclude any that aren't in any of them
	// go through members, and deselect anybody with an explicitly Red tag:
	for ( let idx = 0; idx < list.length; idx++ ) {
		let member = list[idx];
		let tagList = member['tagArray'];
		let tagMatchCount = 0;
		let deselect = empty ( gSelected[member.userID] );			// may already be deselected (gSearch)
		if ( !deselect && !empty(tagList) ) {
			// go through all the tags for each user
			for ( let tdx = 0; tdx < tagList.length; tdx++ ) {
				let tagID = parseInt(tagList[tdx]);
				let tag = gTagList[tagID];
				if ( !empty(tag) ) {
					if ( yesTagCount && tagChecked('yes',tagID) ) {
						tagMatchCount++;
					}
					if ( tagChecked('no',tagID) ) {
						deselect = 1;
						break;
					}
				}
			}
			if ( yesTagCount ) {
				if ( !tagMatchCount ) deselect = 1;			// didn't match any of the Yes tags
				if ( matchAllTags && yesList.length != tagMatchCount ) deselect = 1;
			}
		} else {
			if ( yesTagCount ) deselect = 1;		// no tags at all
		}
		if ( yesTagCount && !tagMatchCount ) deselect = 1;
		if ( deselect ) {
			let ckbox = document.getElementById(`sel-${member.userID}`);
			if ( !empty(ckbox) ) ckbox.checked = 0;
			gSelected[member.userID] = 0;
		} else {
			count++;
		}
	}
	return count;
}

function markMembersInRadius ( list, ctrLat, ctrLng, useZip, radius=0 )
{
	let count = 0;
	for ( let idx = 0; idx < list.length; idx++ ) {
		let member = list[idx];
		let inside = 1;		// if no lat/lng, don't include them
		let distance = 0;
		if ( useZip ) {
			inside = 0;
			if ( radius > 0 && !empty(member.lat) && !empty(member.lng) ) {
				distance = geoDistance ( member.lat, member.lng, ctrLat, ctrLng );
				if ( distance <= radius ) inside = 1;
			}
		}
		// don't select anybody because of this, only DEselect if not inside
		if ( !inside ) {
			gSelected[member.userID] = inside;
			let ckbox = document.getElementById(`sel-${member.userID}`);
			if ( !empty(ckbox) ) ckbox.checked = inside;
		}
		let zip = document.getElementById(`zip-${member.userID}`);
		if ( !empty(zip) ) {
			zip.style.color = inside ? 'black' : 'darkred';
			zip.style.textDecorationLine = inside ? 'none' : 'line-through';
		}
		let dist = document.getElementById(`dist-${member.userID}`);
		if ( distance && !empty(dist) ) {
			let rnd = Math.trunc ( distance );
			if ( distance < 5 ) rnd = Math.round(distance * 10) / 10;
			dist.innerHTML = `${rnd} mi`;
			dist.style.color = inside ? 'black' : 'darkred';
			//dist.style.textDecorationLine = inside ? 'none' : 'line-through';
		}
		if ( gSelected[member.userID] ) count++;
	}
	clearMapPins();
	displayPeopleOnMap ( list, 0, 1 );

	return count;
}

function markAlreadySent ( list )
{
	let count = 0;
	// don't select anybody because of this, only DEselect if alreadySent
	if ( gSelectAlreadySent ) return;

	for ( let idx = 0; idx < list.length; idx++ ) {
		let member = list[idx];
		let userID = member.userID;
		let lastSent = "";
		let alreadySent = 0;
		let chooseAlreadySent = 0;
		if ( !empty(gHistory['activity']) ) {
			let history = gHistory['activity'][userID];
			if ( !empty(history) ) {
				lastSent = history.firstSent;
				if ( !empty(history.lastSent) ) {
					lastSent = history.lastSent;
				}
			}
		}
		if ( !empty(lastSent) ) {
			alreadySent = 1;
		}
		if ( gSelectAlreadySent || !alreadySent ) {
			chooseAlreadySent = 1;
		}
		if ( !chooseAlreadySent ) gSelected[member.userID] = chooseAlreadySent;
		let ckbox = document.getElementById(`sel-${member.userID}`);
		let dist = document.getElementById(`dist-${member.userID}`);
		if ( !empty(ckbox) ) ckbox.checked = chooseAlreadySent;
		if ( member.memberState == 'Unsubscribed' ) {
			dist.innerHTML = `Unsubscribed`;
			dist.style.color = 'darkmagenta';
		} else {
			if ( !empty(lastSent) ) {
				if ( !empty(dist) ) {
					let sent = elapsedTime ( date_from_sql(lastSent) );
					dist.innerHTML = `Sent ${sent} ago`;
					dist.style.color = gSelectAlreadySent ? 'darkred' : 'black';
					//dist.style.textDecorationLine = inside ? 'none' : 'line-through';
				}
			}
		}
	}
}

