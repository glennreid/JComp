
/*
 * 2/12/2023
 *
 * weather.js
 *
 * Support functions for ZIPit Weather cards
 */



function tempExtremes ( degrees, units )
{
	var level = 0;
	switch ( units ) {
		case "imperial":
			// cold
			if ( degrees < 43 ) level = -1;
			if ( degrees < 30 ) level = -2;
			if ( degrees < 15 ) level = -3;
			if ( degrees < 10 ) level = -4;
			// hot
			if ( degrees > 80 ) level = 1;
			if ( degrees > 90 ) level = 2;
			if ( degrees > 100 ) level = 3;
			break;
		case "metric":
			// cold
			if ( degrees < 6.1 ) level = -1;
			if ( degrees < -1.1 ) level = -2;
			if ( degrees < -9.4 ) level = -3;
			if ( degrees < -12 ) level = -4;
			// hot
			if ( degrees > 27 ) level = 1;
			if ( degrees > 32 ) level = 2;
			if ( degrees > 37 ) level = 3;
			break;
	}
	return level;
}

function make_weather_summary ( )
{
	var weatherList = gData.weather.list;
	var html = "";
	var max = 0, min = 999;
	var tempStr = "";
	var day = weatherList[0];
	var units = gData.weather.units;
	var unitsShort = "F";
	var precip = "";	// we collect this data when looping through, then replace(XX_ICONS_XX) at the end
	var windy = "";
	var cloudy = "";

	html += "<div class='weather_desc'>\n";
	
	if ( units == "metric" ) unitsShort = "C";

	// find max and min in the future
	for ( var idx = 0; idx < weatherList.length; idx++ ) {
		var rec = weatherList[idx];
		if ( !empty(rec['main']) ) {
			var data = rec['main'];
			var temp = Math.round ( parseFloat(data.temp) );
			if ( temp < min ) min = temp;
			if ( temp > max ) max = temp;
		}
	}
	if ( !empty(day['main']) ) {
		var data = day['main'];
		var temp = Math.round ( parseFloat(data.temp) );
		tempStr = "" + temp + "º" + unitsShort;
		maxDay = Math.round ( parseFloat(data.temp_max) );
		minDay = Math.round ( parseFloat(data.temp_min) );
		if ( minDay < min ) min = minDay;
		if ( maxDay > max ) max = maxDay;
	}
	if ( !empty(day['weather']) ) {
		var data = day['weather'][0];
		var str = data.description;
		if ( str.includes("cloud") || str.includes("overcast") ) cloudy += "🌥";
		str = str[0].toUpperCase() + str.substring(1);
		var description = `XX_ICONS_XX${str}`;
		html += `<div id='weather_desc' class='weather_desc'>${description}`;
		if ( !empty(max) && !empty(min) ) {
			html += "<span class='weather_summary'>\n";
				if ( is_mobile() ) {
					html += "&nbsp;&ndash; &nbsp;";
				} else {
					html += "<br/>\n";
				}
				html += "<span style='color:blue'>Min</span>: ";
				html += `${min}º ${unitsShort}`;
				html += ` / <span style='color:darkred'>Max</span>: `;
				html += ` ${max}º ${unitsShort}`;
				var coldLevel = tempExtremes ( min, units );
				if ( coldLevel < 0 ) {
					cold = "";
					for ( var jdx = 0; jdx > coldLevel; jdx-- ) cold += "🥶";
					if ( coldLevel >= 4 ) cold += "💀";
					html += "&nbsp;&nbsp;" + cold;
				}
				var heatLevel = tempExtremes ( max, units );
				if ( heatLevel > 0 ) {
					hot = "";
					for ( var jdx = 0; jdx < heatLevel; jdx++ ) hot += "🥵";
					if ( heatLevel >= 3 ) hot += "🔥💀";
					html += "&nbsp;&nbsp;" + hot;
				}
			html += "</span>\n";
		}
		html += "</div>\n";
	}
	html += "<div class='weather_table'>\n";
	html += "<table>";
		if ( !empty(day['rain']) || !empty(day['snow']) ) {
			var list = day['rain'];
			if ( !empty(list) ) precip += "🌧";
			for ( var key in list ) {
				if ( key.includes("h") ) {
					//var pct = Math.round ( parseFloat(list[key]) * 100 );
					var inch = list[key];
					var hours = key.split("h")[0];
					html += "<tr>" + make_spacer(8);
					html += "<td><span class='weather_label'><b>Rain:</span></td><td>" + inch + " inches</td><td> in the next " + hours + " hours</td></tr>";
				}
			}
			var list = day['snow'];
			if ( !empty(list) ) precip += "❄️";
			for ( var key in list ) {
				if ( key.includes("h") ) {
					//var pct = Math.round ( parseFloat(list[key]) * 100 );
					var inch = list[key];
					var hours = key.split("h")[0];
					html += "<tr>" + make_spacer(8);
					html += "<td><span class='weather_label'><b>Snow:</span></td><td>" + inch + " inches</td><td> in the next " + hours + " hours</td></tr>";
				}
			}
		}
		if ( !empty(day['wind']) ) {
			var rec = day['wind'];
			var speed = Math.round ( parseFloat(rec['speed']) );
			var gust = Math.round ( parseFloat(rec['gust']) );
			if ( speed > 10 || gust > 20 ) {
				windy += "💨";
				html += "<tr>" + make_spacer(8);
				html += "<td><span class='weather_label'><b>Wind:</span></td><td>" + speed + "mph</td><td>  <span class='darkred'>gusts</span> to " + gust + "mph</td></tr>";
			}
		}
		html += "</div>\n";
	html += "</table>\n";
	
	var icons = `${cloudy}${precip}${windy}`;
	if ( icons.length > 0 ) icons += `&nbsp;&nbsp;`;
	html = html.replace ( "XX_ICONS_XX", icons );

	html += "</div>\n";

	return html;
}

function make_spacer ( indent=1 )
{
	var html = "<td class='text_right'>"
	for ( var idx = 0; idx < indent; idx++ ) {
		html += "&nbsp;";
	}
	html += "</td>";
	return html;
}

function make_weather_row ( rowIdx, col1, temp, date, unitsShort )
{
	var html = "<tr class='weather_row'>";
	var time = short_time(date);
	var tempStr = "<span class='temp'>" + temp + "</span>º" + unitsShort;
	var timeStr = "<span class='smaller black'>" + time + "</span>";

	if ( !empty(col1) ) {									// first row only
		html += "<td class='feature text_right'>" + col1 + "</td>";
		html += make_spacer(4);
	} else {
		html += make_spacer();
		html += make_spacer();
	}
	html += "<td>" + tempStr + "</td>";
	html += make_spacer();	// spacer
	html += "<td>" + timeStr + "</td>";
	html += make_spacer();
	if ( rowIdx == 0 ) {		// a special place to put user comments...
		html += "<td>      </td>";
	} else {
		html += make_spacer();
	}
	html += "</tr>";
	
	return html;
}

function make_weather_forecast ( )
{
	var weatherList = gData.weather.list;
	var html = "";
	var wtable = "<table>";
	var units = gData.weather.units;
	var unitsShort = "F";

	if ( units == "metric" ) unitsShort = "C";

	html += "<div class='weather_table'>\n";

	for ( var idx = 0; idx < weatherList.length; idx++ ) {
		var rec = weatherList[idx];
		var utc = rec['dt'];
		var date = new Date ( utc * 1000 );
		var imageURL = null;
		var row = "";
		if ( !empty(rec['main']) ) {
			var data = rec['main'];
			var temp = Math.round ( parseFloat(data.temp) );
			var col1 = "";
			if ( idx == 0 ) col1 = "<span class='weather_label'>Next 9 Hours</span>";
			wtable += make_weather_row ( idx, col1, temp, date, unitsShort );
		}
	}
	wtable += "</table>";

	html += wtable;
	html += "</div>\n";

	return html;
}

function make_weather_card()
{
	var html = "";
	var subtitle = "";
	var title = "Weather";
	var text = "";
	var wtable = "";
	
	if ( !empty(gData.weather.city) ) {
		title += " in " + gData.weather.city.name;
	} /*else if ( !empty(gLoc.view.zip) ) {
		title += " in " + gLoc.view.zip;
	}*/
	title = "<div class='weather_title'>" + title + "</div>";
	title += "<div class='weather_comment' id='weather_comment'> </div>";
	subtitle = make_weather_summary();
	text = make_weather_forecast();
	
	var postRec = {
		'postID': WEATHER_CARD,
		'parentID': 0,
		'title': title,
		'subtitle': subtitle,
		'body': text,
		'link': null,
		'caption': null,
		'source': null,
		'imageURL': null
	}
	html += make_full_card ( cPostType.WEATHER, null, postRec, TOOLBAR_LOVES );

	return html;
}

