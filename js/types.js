
/*
 * 2/18/2023
 *
 * types.js
 *
 * Support functions for ZIPit cards
 */

const FIND_ZIP = 		1;
const DATA_FORCE =		1;
const JUST_UI = 		1;
const LOOK_UP_CITY =	1;

var BAR_NONE = 		  0;
var BAR_VOTES = 	  1;
var BAR_LOVES =		  2;
var BAR_FRIENDS = 	  4;
var BAR_GROUPS = 	  8;
var BAR_COMMENTS = 	 16;
var BAR_NO_RULE =	 32;	// horizontal rule, determined at runtime

var STANDARD = ( BAR_VOTES|BAR_LOVES|BAR_COMMENTS );
var TOOLBAR_LOVES = BAR_LOVES;

var WEATHER_CARD =	-1;

const SPACER = '————————';
const EDITING =		1;
const INVITES =		1;
const NO_INVITES =	0;
const AND_POST =	1;
const ALL_FEEDS =	0;

const cAlign = {
	'LEFT': 	1,
	'RIGHT': 	2,
	'CENTER': 	3,
}

const cPage = {
	'ROOT':		70,
	'LAND':		71,
	'HOME':		72,
	'ME':		73,
	'GROUP':	74,
	'MEMBERS':	75,
	'EVENT':	76,
	'CLIENT':	77,
	'POST':		78,
	'TOPIC':	79,
	'MLIST':	80,
	'PHOTO':	81,
	'ACCOUNT':	82,
	'ADMIN':	83,
	'TAGS':		84,
	'HISTORY':	85,
	'FRIENDS':	86,
	'ADMIN':	99,
	'LAST':	   799
};

const cPageName = {
	70: 'ROOT',
	71: 'LAND',
	72: 'HOME',
	73: 'ME',
	74: 'GROUP',
	75: 'MEMBERS',
	76: 'EVENT',
	77: 'CLIENT',
	78: 'POST',
	79: 'TOPIC',
	80: 'MLIST',
	81: 'PHOTO',
	82:	'ACCOUNT',
	83:	'ADMIN',
	84:	'TAGS',
	85: 'HISTORY',
	86: 'FRIENDS',
	99: 'ADMIN',
	799: 'LAST'
};

const cPostType = {
	'USER':	1,
	'GROUP':	2,
	'COMMENT':	3,
	'AD':		4,
	'LINK':		5,
	'INVITE':	6,
	'EVENT':	7,
	'MESSAGE':	8,
	'WEATHER':	11,
	'NEWS':		12,
	'BIZ':		13,
	'TICKETS':	14,
	'REDDIT':	15,
	'LAST':		99
};

const cReactions = {
	'LIKED':		1,
	'DISLIKED':		2,
	'LOVED':		3,
	'UNLOVED':		4,
	'LOATHED':		5,
	'UNLOATHED':	6,
	'LAST':		99
};

var cEmoji = [
	"",
	"🤟Yep",
	"👎Nope",
	"❤️Love",
	"🤍Love",
	"🤬Loathe",
	"😠Loathe",
	"LAST"
];
if ( is_mobile() ) {
	cEmoji = [
		"",
		"🤟 ",
		"👎 ",
		"❤️ ",
		"🤍 ",
		"🤬 ",
		"😠 ",
		"LAST"
	];
}

var gLoc = {
	'curr': {
		'city': "",
		'region': "",
		'population': "",
		'wikiDataId': "",
		'zip': "",
		'lat': 0,
		'lng': 0,
		'latlng': "",
	},
	'view': {
		'city': "",
		'region': "",
		/*
		'city': "Woodside",
		'region': "CA",
		*/
		'population': "",
		'wikiDataId': "",
		'zip': "",
		'lat': 0,
		'lng': 0,
		'latlng': "",
		/*
		'zip': "94062",
		'lat': 37.377297,
		'lng': -122.2568367,
		'latlng': "37.3772971,-122.2568367",
		*/
	'ip': {
		'city': "",
		'region': "",
		'population': "",
		'wikiDataId': "",
		'zip': "",
		'lat': 0,
		'lng': 0,
		'latlng': "",
	},
	}
};

var gData = {
	'meta': { 'v':1 },
	'categories': null,
	'groups': null,
	'friends': null,
	'users': { },
	'refreshZipCode': 1,
	'timer': null,
	'biz': null,
	'posts': null,
	'ads': null,
	'events': null,
	'eventtickets': null,
	'eventpeople': null,
	'market': null,
	'messages': null,
	'weather': null,
	'news': null,
	'tickets': null,
	'reddit': null,
	'gpt': null,
	'jokes': null,
	'zipcodes': null,
};

var gGroup = {
	'groupID': null,
	'title': null,
	'zip': null,
	'charter': null,
	'members': null,
};
var gEvent = null;

var gNearbyCities = {
	'Curr': {
		'city': "",
		'region': "",
		'data': null,
		'loading': 0
	},
	'View': {
		'city': "Woodside",
		'region': "CA",
		'data': null,
		'loading': 0
	},
};

const gFeed = {
	'ANY':		0,
	'USER':		1,
	'COMMENT':	2,
	'MESSAGE':	3,
	'WEATHER':	4,
	'NEWS':		5,
	'BIZ':		6,
	'TICKETS':	7,
	'GPT':		8,
	'JOKE':		9,
	'ADMIN':   10,
	'AD':	   11,
	'REDDIT':  12,
	'LAST':	   99
};

const gFeedStr = {
	0: 'ANY',
	1: 'USER',
	2: 'COMMENT',
	3: 'MESSAGE',
	4: 'WEATHER',
	5: 'NEWS',
	6: 'BIZ',
	7: 'TICKETS',
	8: 'GPT',
	9: 'JOKE',
	10: 'ADMIN',
	11: 'AD',
	12: 'REDDIT',
	99: 'LAST'
};

function is_post_type ( cardType )
{
	var isPostType = false;
	if ( cardType == cPostType.USER ) isPostType = true;
	if ( cardType == cPostType.GROUP ) isPostType = true;
	if ( cardType == cPostType.COMMENT ) isPostType = true;
	//if ( cardType == cPostType.AD ) isPostType = true;

	return isPostType;
}

