
/*
 * Glenn Reid
 *
 * 5/9/2017
 *
 * dates.js
 *
 * Functions to do what Javascript Date objects should already know how to do
 */

const APRIL_ONE = 1680307200;

function now ( )
{
	let timeNow = new Date();
	//timeNow = Math.round ( timeNow / 1000 );	// JS dates are milliseconds
	return timeNow;
}

function is_today ( otherDate )
{
	let today = new Date(),
      day = today.getDate(),
      month = today.getMonth() + 1,
      year = today.getFullYear();
	let otherDay = otherDate.getDate(),
      otherMonth = otherDate.getMonth() + 1,
      otherYear = otherDate.getFullYear();
	
	if ( day == otherDay && month == otherMonth && year == otherYear ) return true;
	return false;
}

function is_yesterday ( otherDate )
{
	let today = new Date(),
      day = today.getDate(),
      month = today.getMonth() + 1,
      year = today.getFullYear();
	let otherDay = otherDate.getDate(),
      otherMonth = otherDate.getMonth() + 1,
      otherYear = otherDate.getFullYear();
	
	if ( day == (otherDay+1) && month == otherMonth && year == otherYear ) return true;
	return false;
}

function this_week ( otherDate )
{
	let today = new Date();
	let elapsed = Math.trunc ( (today-otherDate) / 1000 );
	let oneWeek = (60*60*24*7);
	if ( elapsed < oneWeek ) return true;

	return false;
}

function short_date ( date )
{
	let today = new Date(),
		day = date.getDate(),
		month = date.getMonth() + 1,
		year = date.getFullYear(),
		hours = date.getHours(),
		minutes = date.getMinutes();
	
	return ""+month+"/"+day;
}

function current_year ( long=0 )
{
	let today = new Date();
	let year = today.getFullYear();
		
	if ( !long ) {
		year = year.toString().substr(-2);
	}
	return year;
}

function ics_format ( date )
{
	// like  20230313T163000
	// parse 2023 03 13  T 1630 00
	// parse YEAR MO DAY T HHMM SS
	let	day = date.getDate(),
		month = date.getMonth() + 1,
		year = date.getFullYear(),
		hour = date.getHours(),
		minute = date.getMinutes();
	if ( month < 10 ) month = "0" + month;
	if ( day < 10 ) day = "0" + day;
	if ( hour < 10 ) hour = "0" + hour;
	if ( minute < 10 ) minute = "0" + minute;
	let result = `${year}${month}${day}T${hour}${minute}00`;
	
	return result;
}


function short_time ( date=null, militaryHours=0 )
{
	if ( !date ) date = new Date();
	//let today = new Date();
	let day = date.getDate();
	let month = date.getMonth() + 1;
	let year = date.getFullYear();
	let hours = date.getHours();
	let minutes = date.getMinutes();
	let evenTen = false;
	if ( militaryHours === undefined ) militaryHours = 0;
	
	if ( minutes % 10 == 0 )	evenTen = true;

	if ( minutes < 10 ) {
		minutes = "0" + minutes;
	}
	//if ( evenTen ) minutes += "0";
	
	if ( militaryHours == 24 ) {
		return "" + hours + ":" + minutes;
	} else {
		let suffix = "am";
		if ( hours >= 12 ) {
			suffix = "pm";
			if ( hours > 12 ) hours -= 12;
		}
		if ( hours == 0 ) hours = 12;
		return "" + hours + ":" + minutes + suffix;
	}
}

function day_time ( date, withSeconds = false )
{
	let result = "";
	let dateStr = "";
	let suffix = "am";
	let today = new Date(),
		day = date.getDate(),
		weekday = date.getDay(),
		month = date.getMonth() + 1,
		year = date.getFullYear(),
		hours = date.getHours(),
		minutes = date.getMinutes();
		seconds = date.getSeconds();
	
	if ( hours >= 12 ) {
		if ( hours > 12 ) hours -= 12;
		suffix = "pm";
	}
	//if ( hours < 10 ) hours = "0" + hours;
	if ( minutes < 10 ) minutes = "0" + minutes;
	
	if ( is_today(date) ) {
		dateStr += "Today";
	} else {
		dateStr += ""+month+"/"+day;
		if ( year != today.getFullYear() ) {
			dateStr += "/"+year;
		}
	}
	result = dateStr + " " + hours + ":" + minutes;
	if ( withSeconds ) {
		result += ":" + seconds;
	}
	result += suffix;
	
	return result;
}

function day_time_long ( date, withSeconds = false )
{
	let daynames = [ 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday' ];
	let result = "";
	let dateStr = "";
	let suffix = "am";
	let today = new Date(),
		day = date.getDate(),
		weekday_ord = date.getDay(),
		month_ord = date.getMonth() + 1,
		year = date.getFullYear(),
		hours = date.getHours(),
		minutes = date.getMinutes();
		seconds = date.getSeconds();
	let weekday = daynames[weekday_ord];
	let month = date.toLocaleString('default', { month: 'long' });
	if ( hours >= 12 ) {
		if ( hours > 12 ) hours -= 12;
		suffix = "pm";
	}
	//if ( hours < 10 ) hours = "0" + hours;
	if ( minutes < 10 ) minutes = "0" + minutes;
	
	if ( is_today(date) ) {
		dateStr += "Today";
	} else {
		dateStr += `${weekday}, ${month} ${day}`;
		if ( year != today.getFullYear() ) {
			dateStr += " "+year;
		}
	}
	result = dateStr;
	if ( hours + minutes > 0 ) {
		result += " at " + hours + ":" + minutes;
		if ( withSeconds ) {
			result += ":" + seconds;
		}
		result += suffix;
	}
	
	return result;
}

function short_date_time ( date, withSeconds = false )
{
	if ( !date ) date = new Date();
	let result = "";
	let dateStr = "";
	let suffix = "am";
	let today = new Date(),
		day = date.getDate(),
		month = date.getMonth() + 1,
		year = date.getFullYear(),
		hours = date.getHours(),
		minutes = date.getMinutes();
		seconds = date.getSeconds();
	
	if ( hours >= 12 ) {
		if ( hours > 12 ) hours -= 12;
		suffix = "pm";
	}
	//if ( hours < 10 ) hours = "0" + hours;
	if ( minutes < 10 ) minutes = "0" + minutes;
	
	if ( is_today(date) ) {
		dateStr = "Today"
	} else if ( is_yesterday(date) ) {
		dateStr = "Yesterday"
	} else {
		dateStr = ""+month+"/"+day;
	}
	result = dateStr + " " + hours + ":" + minutes;
	if ( withSeconds ) {
		result += ":" + seconds;
	}
	result += suffix;
	
	return result;
}

function jdate ( isoDate, func )
{
	let jDate = new Date(isoDate);
	let dateStr = func ( jDate );
	return dateStr;
}

function valid_SQL_date ( date )
{
	let result = true;
	
	if ( empty(date) )
		return false;
	
	if ( date.length < 10 )
		return false;
		
	if ( date == "0000-00-00 00:00:00" )
		return false;
	
	return true;
	
}

function date_from_sql ( sqldate )
{
	let now = new Date();
	let date = null;
	let timeZoneOffset = now.getTimezoneOffset();
	// https://stackoverflow.com/questions/3075577/convert-mysql-datetime-stamp-into-javascripts-date-format
	if ( valid_SQL_date(sqldate) ) {
		// Split timestamp into [ Y, M, D, h, m, s ]
		let t = sqldate.split(/[- :]/);

		// Apply each element to the Date function
		//let date = new Date(Date.UTC(t[0], t[1]-1, t[2], t[3], t[4], t[5]));
		date = new Date(t[0], t[1]-1, t[2], t[3], t[4], t[5]);
		//date.timeZoneOffset = timeZoneOffset;
	}
	return date;
}

function UTC_from_sql ( sqldate ) {
	let jDate = date_from_sql ( sqldate );
	return UTC_from_java ( jDate );
}

function readable_date_from_sql ( sqldate )
{
	let jDate = date_from_sql ( sqldate );
	let result = "";
	let dateStr = "";
	let suffix = "am";
	if ( empty(jDate) ) {
		jDate = new Date();
	}
	let theday = new Date(),
		day = jDate.getDate(),
		month = jDate.getMonth() + 1,
		year = jDate.getFullYear(),
		hours = jDate.getHours(),
		minutes = jDate.getMinutes();
	let today = new Date();
	let thisYear = today.getFullYear();
	let options = { weekday:'short', year:'numeric', month: 'short', day:'numeric' };

	if ( hours >= 12 ) {
		if ( hours > 12 ) hours -= 12;
		suffix = "pm";
	}
	//if ( hours < 10 ) hours = "0" + hours;
	if ( minutes < 10 ) minutes = "0" + minutes;

	if ( is_today(jDate) ) {
		dateStr = ""+month+"/"+day;
		dateStr = jDate.toLocaleString('en-US', options);
	} else {
		dateStr = ""+month+"/"+day;
		if ( thisYear != year ) {
			dateStr += "/" + year;
		}
	}
	result = dateStr + " @ " + hours + ":" + minutes;

	result += suffix;
	return result;
}

function date_to_sql ( jdate )
{
	let sqldate = "0000-00-00 00:00:00";
	if ( !empty(jdate) ) {
		let Y = jdate.getFullYear();
		let M = jdate.getMonth() + 1;
		let D = jdate.getDate();
		let Z = jdate.getTimezoneOffset() / 60;
		let H = jdate.getHours(); // + Z;
		let m = jdate.getMinutes();
		let s = jdate.getSeconds();
		//let millis = Date.UTC ( Y, M, D, H, m, s);

		if ( M < 10 ) M = "0" + M;
		if ( D < 10 ) D = "0" + D;
		if ( m < 10 ) m = "0" + m;
		if ( s < 10 ) s = "0" + s;

		let sdate = Y + "-" + M + "-" + D;
		let stime = H + ":" + m + ":" + s;
		sqldate = sdate + " " + stime;
	}
	return sqldate;
}


function UTC_from_java ( jdate )
{
	let Y = jdate.getFullYear();
	let M = jdate.getMonth() + 1;
	let D = jdate.getDate();
	let Z = jdate.getTimezoneOffset() / 60;
	let H = jdate.getHours() + Z;
	let m = jdate.getMinutes();
	let s = jdate.getSeconds();
	let millis = Date.UTC ( Y, M, D, H, m, s);
	return millis / 1000;
}

function minutesFromTime ( time, minutesHence )
{
	let future = new Date(time.getTime() + ((minutesHence * 60) * 1000));
	//let future = time + ((minutesHence * 60) * 1000);
	return future;
}

function minutesFromNow ( minutesHence )
{
	let now = new Date();
	let future = minutesFromTime ( now, minutesHence );
	return future;
}

// in the future:
function secondsUntil ( compareDate )
{
	let now = new Date();
	let timeZoneOffset = now.getTimezoneOffset();
	now.timeZoneOffset = 0;
	//let diff = Math.abs(compareDate - now);
	let diff = (compareDate - now);
	let seconds = diff / 1000;
	let minutes = seconds / 60;
	let hours = minutes / 60;
	let days = hours / 24;
	return seconds;
}

function minutesUntil ( compareDate )
{
	let now = new Date();
	let timeZoneOffset = now.getTimezoneOffset();
	now.timeZoneOffset = 0;
	//let diff = Math.abs(compareDate - now);
	let diff = (compareDate - now);
	let seconds = diff / 1000;
	let minutes = seconds / 60;
	let hours = minutes / 60;
	let days = hours / 24;
	return minutes;
}

// in the past:
function secondsElapsedSince ( compareDate )
{
	let now = new Date();
	let timeZoneOffset = now.getTimezoneOffset();
	now.timeZoneOffset = 0;
	let diff = Math.abs(now - compareDate);
	let seconds = diff / 1000;
	let minutes = seconds / 60;
	let hours = minutes / 60;
	let days = hours / 24;
	return seconds;
}

function minutesElapsedSince ( compareDate )
{
	let now = new Date();
	let timeZoneOffset = now.getTimezoneOffset();
	now.timeZoneOffset = 0;
	let diff = Math.abs(now - compareDate);
	let seconds = diff / 1000;
	let minutes = seconds / 60;
	let hours = minutes / 60;
	let days = hours / 24;
	return minutes;
}

function hoursElapsedSince ( compareDate )
{
	let now = new Date();
	let timeZoneOffset = now.getTimezoneOffset();
	now.timeZoneOffset = 0;
	let diff = Math.abs(now - compareDate);
	let seconds = diff / 1000;
	let minutes = seconds / 60;
	let hours = minutes / 60;
	let days = hours / 24;
	return hours;
}

function daysElapsedSince ( compareDate )
{
	let now = new Date();
	let timeZoneOffset = now.getTimezoneOffset();
	now.timeZoneOffset = 0;
	let diff = Math.abs(now - compareDate);
	let seconds = diff / 1000;
	let minutes = seconds / 60;
	let hours = minutes / 60;
	let days = hours / 24;
	return days;
}

function elapsedFormat ( amount, units )
{
	let absAmount = Math.abs ( amount );
	let text = '' + absAmount + ' ' + units;
	if ( absAmount > 1 ) text += 's';
	return text;
}

function elapsedTime ( pastDate )
{
	let now = new Date();
	let interval = Math.abs(now - pastDate);
	return elapsedInterval ( interval, now );
}

function elapsedInterval ( interval )
{
	let seconds = Math.trunc(interval / 1000);
	let minutes = Math.trunc(seconds / 60);
	let hours = Math.trunc(minutes / 60);
	let days = Math.trunc(hours / 24);
	let months = Math.trunc(days / 30);
	let units = 'seconds';

	if ( Math.abs(months) >= 2 ) return elapsedFormat ( months, 'month' );
	if ( Math.abs(days) >= 2 ) return elapsedFormat ( days, 'day' );
	if ( Math.abs(hours) >= 2 ) return elapsedFormat ( hours, 'hour' );
	if ( Math.abs(minutes) >= 2 ) return elapsedFormat ( minutes, 'min' );
	return elapsedFormat ( seconds, 'sec' );
}

function anticipateInterval ( interval, withSeconds=0 )
{
	let seconds = Math.trunc(interval / 1000);
	let minutes = Math.trunc(seconds / 60);
	let hours = Math.trunc(minutes / 60);
	let days = Math.trunc(hours / 24);
	let months = Math.trunc(days / 30);
	let units = 'seconds';
	let str = "";

	if ( Math.abs(months) >= 2 ) return elapsedFormat ( months, 'month' );
	if ( Math.abs(days) >= 2 ) return elapsedFormat ( days, 'day' );
	if ( Math.abs(hours) >= 1 ) {
		str += elapsedFormat ( hours, 'hour' ) + ", ";
		seconds -= (hours*3600);
		minutes -= (hours*60);
	}
	if ( Math.abs(minutes) >= 2 ) {
		if ( !withSeconds && (seconds > 10) ) minutes++;
		str += elapsedFormat ( minutes, 'min' );
		seconds -= (minutes*60);
	}
	if ( withSeconds ) {
		str += ", " + elapsedFormat ( seconds, 'sec' );
	}
	return str;
}

