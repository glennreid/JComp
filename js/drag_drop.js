// drag_drop.js
// Glenn Reid

var gPageDropInitialized = 0;

// suppress the built-in drop handler that wants to view images, etc:
function dropStop(e) { e.stopPropagation();    e.preventDefault(); }

function setup_file_dragdrop ( uid, gid, eid, zoneJQName, chooseButtonName, uploadType )
{
	var dropper = null;
	var zoneJQ = null;

	if ( !empty(zoneJQName) ) zoneJQ = $(`#${zoneJQName}`);

	if ( !empty(zoneJQ) ) {
		dropper = zoneJQ;
		dropper.on('dragenter', function (e) { dropStop(e); $(this).css('border', '2px solid red'); });
		dropper.on('dragleave', function (e) { dropStop(e); $(this).css('border', '2px dotted #0B85A1'); });
		dropper.on('dragover', function (e)  { dropStop(e); });
		dropper.on('drop', function (e) {
			$(this).css('border', '2px dotted #0B85A1');
			e.preventDefault();
			var files = e.originalEvent.dataTransfer.files;
			$(`#${chooseButtonName}`).hide();	// confusing to have this button and if drag/drop is used, they don't need it
			//$("#b_add_photo").hide();
			handleFileDrop ( uid, gid, eid, uploadType, files, null, zoneJQ, null );
		});
		dropper.css('border', '2px dotted #0B85A1');
		//dropper.css('min-height', '60px');
		//dropper.css('max-width', '200px');
	}
	if ( !gPageDropInitialized ) {
		$(document).on('drop', function (e) { dropStop(e); });
		$(document).on('dragenter', function (e) { dropStop(e); });
		$(document).on('dragover', function (e) {
			dropStop(e);
		});
		gPageDropInitialized = 1;
	}
	// handler for browser file uploader:
	var chooser = document.getElementById ( chooseButtonName );
	if ( !empty(chooser) ) {
		chooser.addEventListener("change",
			function() {
				var imageDiv = document.getElementById ( chooseButtonName );
				var files = imageDiv.files;
				for ( var idx = 0; idx < files.length; idx++ ) {
					var file = files[idx];
					var filename = file.name;
					console.log ( "got pic: " + filename );
				}
				handleFileDrop ( uid, gid, eid, uploadType, files, null, zoneJQ, null );
			}
		);
	}
}

function setup_dragdrop ( uid, gid, eid, imageJQName, zoneJQName, progressJQname, buttonUploader, uploadType )
{
	var dropper = null;
	var imageJQ = null;
	var zoneJQ = null;
	var progressJQ = null;
	
	if ( !empty(imageJQName) ) imageJQ = $(`#${imageJQName}`);
	if ( !empty(zoneJQName) ) zoneJQ = $(`#${zoneJQName}`);
	if ( !empty(progressJQname) ) progressJQ = $(`#${progressJQname}`);

	// image display and drop zone at div "imgName"
	if ( !empty(imageJQ) ) {
		dropper = imageJQ;
		dropper.on('dragenter', function (e) { dropStop(e); $(this).css('border', '2px solid red'); });
		dropper.on('dragleave', function (e) { dropStop(e); $(this).css('border', '2px dotted #0B85A1'); });
		dropper.on('dragover', function (e)  { dropStop(e); });
		dropper.on('drop', function (e) {
			$(this).css('border', '2px dotted #0B85A1');
			e.preventDefault();
			var files = e.originalEvent.dataTransfer.files;
			$("#browser_upload_box").hide();	// confusing to have this button and if drag/drop is used, they don't need it
			$("#b_add_photo").hide();
			handleFileDrop ( uid, gid, eid, uploadType, files, imageJQ, zoneJQ, progressJQ );
		});
	}
	// load proper image URL into src tag of image:
	if ( uploadType.includes("USER") ) {
		dropper[0].src = `https://files.zipit.social/php/image_url.php?type=${uploadType}&userID=${gUID}`;
		dropper[0].src = make_user_url ( gUID, 0, "USER_PROFILE" );
	} else {
		//$(`#${buttonUploader}`).hide();
	}
	if ( !empty(zoneJQ) ) {
		dropper = zoneJQ;
		dropper.on('dragenter', function (e) { dropStop(e); $(this).css('border', '2px solid red'); });
		dropper.on('dragleave', function (e) { dropStop(e); $(this).css('border', '2px dotted #0B85A1'); });
		dropper.on('dragover', function (e)  { dropStop(e); });
		dropper.on('drop', function (e) {
			$(this).css('border', '2px dotted #0B85A1');
			e.preventDefault();
			var files = e.originalEvent.dataTransfer.files;
			$("#browser_upload_box").hide();	// confusing to have this button and if drag/drop is used, they don't need it
			$("#b_add_photo").hide();
			handleFileDrop ( uid, gid, eid, uploadType, files, imageJQ, zoneJQ, progressJQ );
		});
		dropper.css('border', '2px dotted #0B85A1');
		//dropper.css('min-height', '60px');
		//dropper.css('max-width', '200px');
	}
	if ( !gPageDropInitialized ) {
		$(document).on('drop', function (e) { dropStop(e); });
		$(document).on('dragenter', function (e) { dropStop(e); });
		$(document).on('dragover', function (e) {
			dropStop(e);
		});
		gPageDropInitialized = 1;
	}
	
	// handler for browser file uploader:
	var chooser = document.getElementById("photo_chooser");
	if ( !empty(chooser) ) {
		chooser.addEventListener("change",
			function() {
				var imageDiv = document.getElementById("photo_chooser");
				var files = imageDiv.files;
				for ( var idx = 0; idx < files.length; idx++ ) {
					var file = files[idx];
					var filename = file.name;
					console.log ( "got pic: " + filename );
				}
				handleFileDrop ( uid, gid, eid, uploadType, files, imageJQ, zoneJQ, progressJQ );
			}
		);
	}
}


var rowCount=0;

function createStatusbar ( type, progressJQ )
{
	var near = progressJQ;
	//near = $("#progress_box");
     rowCount++;
     var row="odd";
     if(rowCount %2 ==0) row ="even";
     this.statusbar = $("<div class='statusbar "+row+"' id='status_bar-"+type+"'></div>");
     this.filename = $("<div class='filename'></div>").appendTo(this.statusbar);
     this.size = $("<div class='filesize'></div>").appendTo(this.statusbar);
     this.progressBar = $("<div class='progressBar'><div></div></div>").appendTo(this.statusbar);
     this.abort = $("<div class='abort'>Abort</div>").appendTo(this.statusbar);
     near.append(this.statusbar);
	
    this.setFileNameSize = function(name,size) {
        var sizeStr="";
        var sizeKB = size/1024;
        if ( parseInt(sizeKB) > 1024 ) {
            var sizeMB = sizeKB/1024;
            sizeStr = sizeMB.toFixed(2)+" MB";
        } else {
            sizeStr = sizeKB.toFixed(2)+" KB";
        }

        this.filename.html(name);
        this.size.html(sizeStr);
    }
    this.setProgress = function(progress)
    {
        var progressBarWidth =progress*this.progressBar.width()/ 100;
        this.progressBar.find('div').animate({ width: progressBarWidth }, 10).html(progress + "% ");
        if ( parseInt(progress) >= 100 ) {
            this.abort.hide();
        }
    }
    this.setAbort = function(fileUploadProcess) {
        var sb = this.statusbar;
        this.abort.click(function() {
            fileUploadProcess.abort();
            sb.hide();
        });
    }
}

function is_video ( extension )
{
	var result = 0;
	var ext = extension.toLowerCase();
	var vid_list = [ "mov", "mp3", "mp4" ];

	if ( vid_list.includes(ext) ) result = 1;
	
	return result;
}

function readCSVFile ( file, ext )
{
	let reader = new FileReader();

	reader.readAsText(file);

	reader.onload = function() {
		let contents = reader.result;
		let delim = ',';
		if ( ext == 'tsv' || ext == 'tab' ) delim = '\t';
		let data = parseCSVData ( contents, delim );
		processCSVData ( data );
		// console.log(reader.result);
	};

	reader.onerror = function() {
		console.log(reader.error);
	};
}

function parseCSVData ( text, delim=',' )
{
    let lines = text.split ( '\n' );
    if ( lines.length < 2 ) {
		lines = text.split ( '\r' );
    }
    let headers = lines[0].split ( delim );
    headers = recognizeHeaders ( headers );

    let data = [];

    for ( let idx = 1; idx < lines.length; idx++ ) {
		const row = lines[idx].split ( delim );
		const obj = {};

		for ( let jdx = 0; jdx < headers.length; jdx++ ) {
			let value = row[jdx];
			let key = headers[jdx];
			if ( key == 'fullName' ) {
				let name = splitFullName ( value );
				obj['first'] = name.first;
				obj['last'] = name.last;
			}
			obj[key] = value;
		}
		data.push(obj);
    }

    // Do something with the parsed data
    return data;
}

function recognizeHeaders ( headers )
{
	for ( let idx = 0; idx < headers.length; idx++ ) {
		let header = headers[idx];
		if ( header == 'OFFICE_EMAIL' ) header = 'email';
		if ( header == 'COMPANY' ) header = 'fullName';
		if ( header == 'OFFICE_EMAIL' ) header = 'company';
		if ( header == 'ADDR1 SHIPPING' ) header = 'addr1';
		if ( header == 'ADDR2 SHIPPING' ) header = 'addr2';
		if ( header == 'CITY SHIPPING' ) header = 'city';
		if ( header == 'STATE SHIPPING' ) header = 'state';
		if ( header == 'POSTAL CODE SHIPPING' ) header = 'zip';
		if ( header == 'COUNTRY' ) header = 'country';
		if ( header == 'NOTES' ) header = 'notes';
		if ( header == 'TAGS' ) header = 'tags';
		/* reference
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
		*/
		headers[idx] = header;
	}
	return headers;
}

/*
// Add event listener to file input
const fileInput = document.getElementById('csvFileInput');
fileInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  parseCSV(file);
});
*/

function handleFileDrop ( uid, gid, eid, type, files, imageJQ, zoneJQ, progressJQ )
{
	var total = files.length;
	var vidCount = 0;
	var goodCount = 0;
	var now = new Date();
	var batch = Math.trunc(now / 1000) - APRIL_ONE;	// smallish unique integer
	
	for ( var idx = 0; idx < files.length; idx++ ) {
		var fd = new FormData();
		var fileName = files[idx].name;
		var comps = fileName.split(".");
		var len = comps.length;
		var ext = comps[len-1];
		if ( is_video(ext) ) {
			vidCount++;
		} else {
			fd.append ( 'file', files[idx] );
			
			console.log ( "uploaded file: " + fileName );

			//maybe if ( ext == 'csv' || ext == 'tsv' || ext == 'tab' ) {
			if ( 0 ) {
				readCSVFile ( files[idx], ext );
			} else {
				if ( !empty(progressJQ) ) {
					var status = new createStatusbar ( type, progressJQ ); //Using this we can set progress.
					status.setFileNameSize ( fileName, files[idx].size );
				}
				sendFileToServer ( idx, total, uid, gid, eid, batch, type, fd, fileName, status, imageJQ, zoneJQ );
			}
			goodCount++;
		}
	}
	if (  vidCount > 0 ) {
		alert ( "Video/audio files not supported. Go use TikTok." );
	}
	return true;
}

function sendFileToServer ( idx, total, uid, gid, eid, batch, type, formData, fileName, statusbar, imageJQ, zoneJQ )
{
    let uploadURL = "https://files.zipit.social/php/file_upload.php"; //Upload URL for image files
    let extraData ={}; //Extra Data.
	let sep = '?';
	
	uploadURL += sep + "idx=" + idx; sep = '&';
	uploadURL += sep + "batch=" + batch; sep = '&';
	uploadURL += sep + "total=" + total; sep = '&';
	uploadURL += sep + "page=" + 100; sep = '&';
	uploadURL += sep + "file=" + fileName; sep = '&';
	if ( type == 'CSV_ADDR' ) {
		//uploadURL += sep + "page=5"; sep = '&';
		if ( !empty(gGeolocate) ) uploadURL += sep + "geo=1"; sep = '&';
		if ( !empty(gUpdateDuplicates) ) uploadURL += sep + "updateDupes=1"; sep = '&';
	}
    
    if ( !empty(uid) )  uploadURL += sep + "uid=" + uid; sep = '&';
    if ( !empty(gid) )  uploadURL += sep + "gid=" + gid; sep = '&';
    if ( !empty(eid) )  uploadURL += sep + "eid=" + eid; sep = '&';
    if ( !empty(type) ) uploadURL += sep + "type=" + type; sep = '&';
    

    let fileUploadProcess = $.ajax({
            xhr: function() {
            let xhrobj = $.ajaxSettings.xhr();
			if ( xhrobj.upload ) {
				xhrobj.upload.addEventListener('progress', function(event) {
					let percent = 0;
					let position = event.loaded || event.position;
					let total = event.total;
					if (event.lengthComputable) {
						percent = Math.ceil(position / total * 100);
					}
					//Set progress
					if ( !empty(statusbar) ) {
						statusbar.setProgress(percent);
						if ( percent == 100 ) {
							//uploadPostProcess ( type, fileName, statusbar, imageJQ, zoneJQ );
						}
					}
				}, false);
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
			processFileData ( data );
        },
		error: function(XMLHttpRequest, textStatus, errorThrown) {
			console.log('Error: ' + errorThrown + " / " + textStatus + " send_post" );
		}
    });
	
	if ( !empty(statusbar) ) {
		statusbar.setAbort(fileUploadProcess);
	}
}

function removeStatusBar ( type )
{
	let barDiv = "#status_bar-" + type;
	$(barDiv).remove();
}

function processFileData ( data )
{
	let comps = data.split("\t");
	if ( comps.length <= 1 ) {
		let decode = JSON.parse ( data );
		if ( !empty(decode) ) {
			if ( decode.type == 'CSV' || decode.type == 'CSV_ADDR' ) {
				processServerCSV ( decode );
			}
		} else {
			alert ( "Bad return from server: " + data );
		}
	} else {
		let ext = comps[0];
		let filename = comps[1];

		$("#post_result").html ( data );

		if ( !empty(imageJQ) ) {
			refreshUploadedPhoto ( uid, gid, eid, batch, idx, total, type, imageJQ, filename );
			uploadPostProcess ( uid, gid, eid, batch, type, filename, statusbar, imageJQ, zoneJQ );
		} else {
		}
		if ( isGroupType(gPageType) ) {
			//refreshSidebarFeatures ( gPageType );
			refreshGroupDataFromServer ( gGroupOfInterestID );
		}
		//$("#status1").append("File upload Done<br>");
		if ( !empty(statusbar) ) {
			setTimeout(function() {
				removeStatusBar ( type );
			}, 1500);
		}
	}
}

var sImageGen = 0;

function uploadPostProcess ( uid, gid, eid, batch, type, fileName, statusbar, imageJQ, zoneJQ )
{
	/*
	if ( !empty(statusbar) ) {
		setTimeout(function() {
			removeStatusBar ( type );
		}, 1500);
	}
	*/
	if ( !empty(imageJQ) ) {
		var image = imageJQ[0];
		var imageUrl = image.src;
		sImageGen++;
		if ( type == "POST" ) {
			//image.src = `https://files.zipit.social/postimg/18`;
		} else {
			/*
			var comps = imageUrl.split ( "/" );
			if ( !empty(comps) ) {
				var len = comps.length;
				if ( len > 2 ) {
					var lastComp = comps[len-1];	// should be user-123 or user-0
					var uid = parseInt ( lastComp );
					var imageUrl = imageUrl.replace ( lastComp, ""+uid+"?zrev="+sImageGen );
				}
			}
			image.src = imageUrl;
			*/
		}
		console.log ( "uploadPostProcess imageUrl: " + imageUrl );
	}

}

