

function jsDate ( sqlDate )
{
	// Split timestamp into [ Y, M, D, h, m, s ]
	var t = sqlDate.split(/[- :]/);

	// Apply each element to the Date function
	var d = new Date(t[0], t[1]-1, t[2], t[3], t[4], t[5]);
	return d;
}

function scrollPercent(view, total)
{
	var top = view.scrollTop();
	var visible = view.outerHeight();
	var missing = total - visible;
	var percent = top / missing;
	//var msg = "Scroll: " + top + ", " + visible + ", " + total;
	//console.log(msg);
	return percent;
}

function navButton ( title, link )
{
	var button = "";
	button += "<div class='navbox'>";
	button += "<a class='navlink' href='" + link + "'>" + title + "</a>";
	button += "</div>";
	return button;
}

function buildNavHTML ( level=1 )
{
	var nav = "";
	var leveler = "";
	for ( var idx = 0; idx < level; idx++ ) {
		leveler += "../";
	}
	nav += navButton ( "Home", leveler );
	nav += navButton ( "About Us", leveler + "about/index.shtml" );
	nav += navButton ( "Classes", leveler + "classes/index.shtml" );
	//nav += navButton ( "Schedule", leveler + "schedule/index.shtml" );
	nav += navButton ( "Concentric", leveler + "concentric/index.shtml" );
	nav += navButton ( "Register", leveler + "register/index.shtml" );
	return nav;
}

function loadTopicsFromServer ( keywords )
{
	var getUrl = 'https://valley.institute/php/json_topic_list.php';
	var sep = '?';

	getUrl += sep + "key1=" + keywords; sep = '&';
	/*
	getUrl += sep + "uid=" + uid; sep = '&';
	getUrl += sep + "flag=" + flagValue; sep = '&';
	console.log(getUrl);
	*/
	jQuery.ajax({url:getUrl,  dataType:'json',
		success:function(data) {
			gTopicList = data;
			//gTopicList.length = Object.keys(gTopicList).length - 1;	// length seems to be off by one for whatever reason
			rebuild_display();
		},
		error: function(XMLHttpRequest, textStatus, errorThrown) {
			console.log('Error: ' + errorThrown + " / " + textStatus + " json_order_list" );
		}
	});
}

function loadSessionsFromServer ( rebuild_proc, keywords )
{
	var getUrl = 'https://valley.institute/php/json_session_list.php';
	var sep = '?';

	getUrl += sep + "key1=" + keywords; sep = '&';
	/*
	getUrl += sep + "uid=" + uid; sep = '&';
	getUrl += sep + "flag=" + flagValue; sep = '&';
	console.log(getUrl);
	*/
	jQuery.ajax({url:getUrl,  dataType:'json',
		success:function(data) {
			gTopicList = data;
			gTopicList.length = Object.keys(gTopicList).length; // why? - 1;
			rebuild_proc();
		},
		error: function(XMLHttpRequest, textStatus, errorThrown) {
			console.log('Error: ' + errorThrown + " / " + textStatus + " json_order_list" );
		}
	});
}

function rebuild_display()
{
	var idx = 0;
	var slides = "<div id='scroller'>\n";
//	slides += "BEGIN<br/>";
	for ( var idx = 0; idx < gTopicList.length; idx++ ) {
		var topic = gTopicList[idx];
		var topicID = topic.topicID;
		var session = topic['session'];
		var sessionID = 0; if ( !empty(session) ) sessionID = session.sessionID;

		slides += "<div class='slide' id='slide_" + idx + "'";
		if ( topic.click !== undefined ) {
			var clicker = " onclick='goto(\"" + topic.click + "\");'";
			slides += clicker;
		}
		slides += ">";
		if ( topic.image !== undefined ) {
			slides += "<img class='imgbox' id='img_" + idx + "' src='./img/" + topic.image + "'>";
		}
		slides += "<div class='titlebox'>\n";
		slides += "  <div class='lh4-code regcode' id='topic_" + topic.topicID + "'><span class='codespan'>" + topic.code + ": </div>\n"
		slides += "  <div class='lh4 topic' id='topic_" + topic.topicID + "'></span><span class='classtitle'>" + topic.title + "</span></div>\n";
		slides += "</div>\n";
		slides += "<div class='clearboth'></div>\n";
		slides += "<div class='summbox'>\n";
		var duration = `${topic.minutes} minute`;
		if ( topic.minutes >= 120 ) {
			var hours = Math.round ( topic.minutes / 60 );
			duration = `${hours} hours`;
			if ( hours > 3 ) duration += ' (includes lunch)';
		}
		slides += `  <div class='duration'>${duration}\n`;
		slides += `    <span class='stylespan'>${topic.style}</span>\n`;
		slides += `  </div>\n`;
		slides += `  <div class='summary'>\n`;
		slides += html_paragraph ( topic.summary );
		slides += `  </div>\n`;
		slides += "</div>\n";
		if ( !empty(topic.details) ) {
			slides += "<div class='descbox'>\n";
			slides += `  <div class='showhidebutton' id='button-${topicID}' onclick='showhide(${topicID});'>↘️ Show Description...</div>\n`;
			slides += `  <div class='details' id='desc-${topicID}' style='display:none;'>\n`;
			slides += html_paragraph ( topic.details );
			slides += `  </div>\n`;
			slides += `</div>\n`;
		}
		registerURL = `../../register/signup.shtml?topic=${topic.topicID}&session=${sessionID}`;
		//if ( !empty(session.url) ) {
		//	registerURL = session.url;
		//}
		slides += `<p class='dtx'><a href='${registerURL}'>`;
			slides += `Ticket: ${topic.code} ${topic.title}</a></p>\n`;
/*
		slides += "<p class='p_desc'>" + topic.summary + "</p>";
		slides += "<p class='dtx'><a href='../../register/signup.shtml?topicID=";
			slides += topic.topicID + "'>Sign me up.</a></p>";
*/
		slides += "</div>";

	}
//	slides += "<br/>END";
	slides += "</div>\n";
	$("#scroller").html ( slides );
	for ( var idx = 1; idx < gTopicList.length; idx++ ) {
		var slide = gTopicList[idx];
		var name = "#slide_" + idx;
		//$(name).css({ 'top' : slide.y });
		//$(name).hide();
	}
}

function positionElements() {
	/*
	if ($(this).scrollTop() > 100) {
		topper.fadeIn( 200 );
	} else {
		topper.fadeOut( 200 );
	}
	*/
	var scrollHead = $(this).scrollTop();
//	var top = ;
//	var bottom = $(hero).height();
	var percent = scrollPercent($(this), $(document).height());
	var perInt = Math.round(percent * 100);
	var percentIn = 0;
	var opacity = 1.0;
	for ( var idx = 0; idx < gList.length; idx++ ) {
		var slide = gList[idx];
		var name = "#slide_" + idx;
		if ( scrollHead >= slide.start && (scrollHead < slide.start+slide.duration) ) {
			var fadeOut = 80;		// percent
			if ( slide.fadeOut !== undefined ) fadeOut = slide.fadeOut;
			var percentOut = fadeOut - (100 - percentIn);
			percentIn = 100 * (scrollHead - slide.start) / slide.duration;
			opacity = 1.0;
			$(name).show();
			if ( percentIn < 20 ) {
				opacity *= (percentIn / 20.0);
				if ( idx == 0 ) opacity = 1.0;			// jam visible on first slide
			}
			if ( percentIn >= fadeOut ) {
				/**/
				var angle = $(name).getRotateAngle();
				angle = (percentOut * 180) - angle;
				//angle = percentOut * 2 * Math.PI;
				//$(name).rotate ( angle );
				/**/
				opacity *= (100.0 - percentOut) / 100.0;
			}
			$(name).css({ 'opacity' : opacity });
			$(name).css({ 'top' : slide.y });
			if ( slide.image !== undefined ) {
				var imgWidth = Math.round((100 - percentIn) );
				var image = "#img_" + idx;
				$(image).css({ 'width' : imgWidth + "%"});
				/*
				if ( percentIn >= 50 ) {
					var angle = $(name).getRotateAngle();
					angle = (percentOut * 180) - angle;
					angle = percentOut * 2 * Math.PI;
					$(image).rotate ( angle );
				}
				*/
			}
			//$(name).fadeIn(1000);
		} else {
			//$(name).fadeOut(1000);
			$(name).hide();
		}
	}
	//$("#logo").rotate(percent * multLeft * 360);
	//$(".mugright").rotate((1-percent) * multRight * 360);
	//$("#top_banner").html("" + perInt + "% " + scrollHead + " in:" + Math.round(percentIn) + "%" );
}

function showhide ( sessionID )
{
	var view = document.getElementById("desc-" + sessionID);
	var button = document.getElementById("button-" + sessionID);
	if ( view.style.display === "none" ) {
		view.style.display = "block";
		button.innerHTML = "↗️ Hide Description...";
	} else {
		view.style.display = "none";
		button.innerHTML = "↘️ Show Description...";
	}
}

function addevent ( session, topic )
{
	var result = "";
	var startJS = jsDate ( session.timeslot );
	var duration = session.minutes;
		if ( empty(duration) ) duration = 90;
	var who = session.instructor;
		if ( who === undefined || who == "" ) who = "Glenn Reid";
	var endJS = new Date(startJS.getTime() + (duration * 60 * 1000));
	var addLabel = `Add to Calendar: ${topic.title}`;
	var title = `Valley Institute - ${topic.title}`;
	var instructor = ` Instructor: ${who}`;
	var startDate = eventFormat ( startJS );
	var endDate = eventFormat ( endJS );

	result += `<div title='Add to Calendar' class='addeventatc'>`;
	result += addLabel;
	result += `<span class='start'>${startDate}</span>`;
	result += `<span class='end'>${endDate}</span>`;
	result += `<span class='timezone'>America/Chicago</span>`;
	result += `<span class='title'>${title}</span>`;
	result += `<span class='instructor'>${instructor}</span>`;
	result += `<span class='location'>1825 W. Saint Paul Ave, Milwaukee, WI 53233</span>`;
	result += `</div>`;

	return result;
}
