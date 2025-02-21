
/*
 * 2/10/2023
 *
 * location.js
 *
 * Location functions for ZIPit
 */


// mapping

var gMap = null;
var gMapChanged = 0;
var gLastMapUpdate = null;
var gMapUpdateLocation = 1;
var gMapTimer = null;
var gMapRefreshDelay = 2;
var gMoreDataRadius = 25;
var gBigLocationChange = 0;
var gMapInitialZoom = 13; // 10.75;
var gShowMapOverlays = 0;
var gMapPinData = [];

var sMapTries = 0;
var sLastFetch = { 'lat':0, 'lng':0, 'name':"", 'date':0 };
var sZipDataRequestSent = 0;
var sZipDataRetries = 0;
var sPersonPinList = [];
var sMarkers = [];

function mapInsert()
{
	if ( empty(gLoc.view.latlng) ) {
		if ( empty(gLoc.view.lat) || empty(gLoc.view.lat) ) {
			if ( !empty(gMe.lat) ) {
				gLoc.view.lat = gMe.lat;
				gLoc.view.lng = gMe.lng;
				gLoc.view.zip = gMe.zip;
				gLoc.view.country = gMe.country;
			} else if ( !empty(gLocIPAddress.lat) ) {
				gLoc.view.lat = gLocIPAddress.lat;
				gLoc.view.lng = gLocIPAddress.lng;
				gLoc.view.zip = gLocIPAddress.zip;
				gLoc.view.country = gLocIPAddress.country;
			} else {
				if ( sMapTries++ < 3 ) {
					findMyself();
					//setTimeout ( mapInsert, 100 );		// call myself back
				}
				return;
			}
		}
		gLoc.view.latlng = "" + gLoc.view.lat + "," + gLoc.view.lng;
	}
	//if ( gShowMap ) {
		if ( empty(gMap) ) {
			let arr = gLoc.view.latlng.split ( "," );
			let mapLat = arr[0]
			let mapLng = arr[1];
			let mapDiv = document.getElementById("map_box");
			let mapProp= {
				center:new google.maps.LatLng(mapLat, mapLng),
				zoom: gMapInitialZoom,
				disableDefaultUI: true, // a way to quickly hide all controls
				//mapTypeControl: true,
				//scaleControl: true,
				//zoomControl: true,
				//zoomControlOptions: { style: google.maps.ZoomControlStyle.LARGE },
				//scrollwheel: false,
				mapTypeId: google.maps.MapTypeId.ROADMAP,
			};
			gMap = new google.maps.Map ( mapDiv, mapProp );
			mapInitialize();
			mapRecentered();

			if ( gShowMapOverlays ) {
				getZipDataFromServer();
				setTimeout ( function() {
					addMapRegion ( mapLat, mapLng );
				},1000);
			}
		}
	//} else {
	//	$("#map_box").height(100);
	//}
}

function mapInitialize()
{
	if ( gMap ) {
		gMap.addListener("center_changed", mapRecentered);
		//$("#map_box").show();
		const {AdvancedMarkerElement} = google.maps.importLibrary("marker");
	}
}

function mapRecentered()
{
	if ( gMap && gShowMap ) {
		let lat = gMap.getCenter().lat();
		let lng = gMap.getCenter().lng();
		if ( lng < -180 ) { lng += 360; }
		if ( lng > 180 ) { lng -= 360; }
		let change = geoDistance ( lat, lng, gLoc.view.lat, gLoc.view.lng );
		if ( change > 0.25 ) {
			//if ( !empty(gLatInterest) ) gMapChanged++;
			gMapChanged++;
			gLoc.view.lat = lat;
			gLoc.view.lng = lng;
			gLastMapUpdate = now();
			if ( gMapUpdateLocation ) {
				updateLocationData ( LOOK_UP_CITY );
				if ( change > 2 ) {
					if ( gShowMapOverlays ) showMapRadius ( lat, lng );
				}
			}
			/*
			if ( gMapTimer ) clearTimeout ( gMapTimer );
			gMapTimer = setTimeout ( function() {
				refreshFromMap();
			}, 1500 );
			*/
		}
		if (!this.mouseDown) {
			//user has clicked the pan button
		}
	}
}

function gotoMapLoc ( lat, lng, zoom=0 )
{
	if ( !empty(gMap) ) {
		//alert ( "unfinished: gotoMapLoc()" );
		//gMap.setCenter ( new google.maps.LatLng(lat, lng) );
		gMap.panTo ( new google.maps.LatLng(lat, lng) );
		if ( !empty(zoom) ) gMap.setZoom ( zoom );
	}
}

function showHideMap ( justTheUI=0 )
{
	if ( justTheUI ) {
		// leave the value, don't toggle it
	} else {
		gShowMap = 1 - gShowMap;
		//sendSettingToServer ( "SHOW_MAP", gShowMap );
	}
	if ( gShowMap ) {
		$("#map_box").show();
		$("#thin_bar").show();
		$("#toggle_map").html ( "Hide Map" );
	} else {
		$("#map_box").hide();
		$("#thin_bar").hide();
		$("#toggle_map").html ( "Show Map" );
	}
}

function resizeMap ( amount=50 )
{
	let height = $("#map_box").height();
	if ( height < 300 && amount < 0 ) {
		amount /= 10;
	}
	height += amount;
	$("#map_box").height ( height );
	$("#map_box").show();
}

function faveMap()
{
	rememberLocation ( gLoc.view );
	refreshZipCodeList ( $("#zip_list") );
}

function gotoRecent()
{
	gotoMapLoc ( -36.9167, 174.709, 9 );		// Auckland
}

function clickExplore()
{
	/*
	gShowMap = 1;
	showHideMap ( JUST_UI );
//	$("#map_box").show();
	$("#thin_bar").show();
	$("#map_box").height(600);
	showMenuSheet ( "top" );
	*/
}

function zipSelect ( obj )
{
	let listChoice = $("#zip_list").val();
	if ( !empty(listChoice) ) {
		if ( listChoice == 'CURR' ) {
			gLoc.view.lat = gLoc.curr.lat;
			gLoc.view.lng = gLoc.curr.lng;
			if ( !empty(gLoc.curr.city) ) gLoc.view.city = gLoc.curr.city;
			if ( !empty(gLoc.curr.zip) )  gLoc.view.zip = gLoc.curr.zip;
			gBigLocationChange = 1;
			updateLocationData();
			gotoMapLoc ( gLoc.curr.lat, gLoc.curr.lng );
		} else {
			let rec = findLocInHistory ( listChoice );
			if ( !empty(rec) ) {
				gLoc.view.lat = rec.lat;
				gLoc.view.lng = rec.lng;
				gLoc.view.city = rec.city;
				gLoc.view.zip = rec.zip;
				gBigLocationChange = 1;
				updateLocationData();
				gotoMapLoc ( rec.lat, rec.lng );
			}
		}
	}
	setTimeout ( function() {
		closeMenuSheet("top");
	}, 300 );
}


/*	from USGS:
	One degree of latitude equals approximately 364,000 feet (69 miles),
	one minute equals 6,068 feet (1.15 miles), and
	one second equals 101 feet.

	One degree of longitude equals 288,200 feet (54.6 miles),
	one minute equals 4,800 feet (0.91 mile), and
	one second equals 80 feet.
*/

function degrees_to_radians(degrees)
{
  let pi = Math.PI;
  return degrees * (pi/180);
}

function makeRoughCircle ( lat, lng, radiusMiles, steps )
{
	let centerX = parseFloat ( lat );
	let centerY = parseFloat ( lng );
	const radiusX = radiusMiles / 69;	// see data above
	const radiusY = radiusMiles / 54.6;
	let increment = 360 / steps;
	let coords = [];
	for ( let angle = 0; angle <= 360; angle += increment ) {
		const radians = degrees_to_radians ( angle );
		let xLoc = centerX + Math.cos(radians) * radiusX;
		let yLoc = centerY + Math.sin(radians) * radiusY;
		coords.push ( { lat: xLoc, lng: yLoc } );
		if ( 1 ) {
			let roundX = Math.trunc(xLoc*100) / 100;
			let roundY = Math.trunc(yLoc*100) / 100;
			//console.log ( `${angle}: ${roundX}, ${roundY}` );
		}
	}
	return coords;
}

function addPinToMap ( pin )
{
	if ( !empty(pin) ) {
		let location = new google.maps.LatLng ( pin[1], pin[2] );
		const marker = new google.maps.Marker({
		  position: location,
		  // icon: icon,
		  title: pin[0],
		  map: gMap,
		});
		sMarkers.push ( marker );
//		const pinBackground = new PinElement({
//			background: "#FBBC04",
//		});
//		const marker = new google.maps.marker.AdvancedMarkerElement({
//			gMap,
//			position: location,
//			title: pin[0],
//			//content: pinBackground.element,
//		});
		marker.addListener("click", () => {
			//map.setZoom(8);
			gMap.setCenter ( marker.getPosition() );
		});
	}
}

function addPinListToMap ( list )
{
	/*
	list = [ ['53201', 43.05, -87.96], [...], [...] ];
	[0:zip, 1:lat, 2:lng]
	const features = [
		{
		  position: new google.maps.LatLng(-33.91721, 151.2263),
		  type: "info",
		},
		{
		  position: new google.maps.LatLng(-33.91539, 151.2282),
		  type: "info",
		},
	];
	*/
	//let iconBase = 'http://www.google.com/mapfiles/';
	//let icon = "../images/beachflag.png";
	for ( let idx = 0; idx < list.length; idx++ ) {
		let pin = list[idx];
	}
}

function clearMapPins ( )
{
	for ( let idx = 0; idx < sMarkers.length; idx++ ) {
		sMarkers[idx].setMap(null);
	}
	sMarkers = [];
	sPersonPinList = [];
}

function zipCoords ( zipStr )
{
	let loc = null;
	let digits = zipStr.length;
	let results = [];
	
	if ( !empty(gData.zipcodes) ) {
		let list = gData.zipcodes;
		for ( let idx = 0; idx < list.length; idx++ ) {
			let zip = list[idx][0];
			let base = zip.substr ( 0, digits );
			if ( base == zipStr ) {
				let lat = list[idx][1];
				let lng = list[idx][2];
				if ( !empty(lat) && !empty(lng) ) {
					results.push ( list[idx] );
				}
			}
		}
	}
	//console.log ( "found " + results.length + " zip codes based on " + zipStr );
	
	return results;
}

var sPoly = null;
function showMapRadius ( lat, lng, radius=20 )
{
	let circle = makeRoughCircle ( lat, lng, radius, 16 );
	const polyPath = new google.maps.Polyline({
		path: circle,
		geodesic: true,
		strokeColor: "#FF0000",
		strokeOpacity: 0.25,
		strokeWeight: 6,
	});
	if ( sPoly ) sPoly.setMap(null);
	polyPath.setMap(gMap);
	sPoly = polyPath;
}

function addMapRegion ( lat, lng )
{
	if ( empty(gData.zipcodes) ) {
		if ( !sZipDataRequestSent ) {
			getZipDataFromServer();
			sZipDataRequestSent = 1;
		}
		if ( sZipDataRetries++ < 8 ) {		// 4 seconds, at 1/2 sec retry interval
			setTimeout ( function() {
				addMapRegion ( lat, lng );
			},500);
			return;
		}
	}
	showMapRadius ( lat, lng );
	let subZip = "" + gLoc.view.zip;
	let coords = zipCoords ( subZip.substring(0,3) );
	addPinListToMap ( coords );
}

function XXrefreshFromMap()
{
	if ( gMapChanged ) {
		let seconds = now() - gLastMapUpdate;
		if ( seconds > gMapRefreshDelay ) {
			setTimeout ( getMoreCityData, 100 );
			gMapChanged = 0;
			gMapTimer = null;
			// if we already have data, and the map center moved, refresh data
			//if ( gData.posts || gData.news || gData.weather || gData.biz ) {
				gData.refreshZipCode = 1;
				if ( gData.timer ) clearTimeout ( gData.timer );
				gData.timer = setTimeout(function() {
					refreshFeedData ( DATA_FORCE );
				}, 3000);
			//} else {
			//}
		} else {
			if ( gMapTimer ) clearTimeout ( gMapTimer );
			gMapTimer = setTimeout ( refreshFromMap, 1500 );
		}
	}
}

function findMyself()
{
	let field = document.getElementById ( "field_location" );
	if ( navigator.geolocation ) {
		navigator.geolocation.getCurrentPosition ( receivePositionFromBrowser );
	} else {
		//field.innerHTML = "Geolocation is not supported by this browser.";
	}
	if ( empty(gLoc.curr.lat) ) {			// we don't know where we are yet
		if ( !empty(gLocIPAddress.lat) ) {
			gLoc.curr.lat = gLocIPAddress.lat;
			gLoc.curr.lng = gLocIPAddress.lng;
			gLoc.curr.zip = gLocIPAddress.zip;
			gLoc.curr.city = gLocIPAddress.city;
			gLoc.curr.country = gLocIPAddress.country;
			gLoc.curr.latlng = "" + gLoc.curr.lat + "," + gLoc.curr.lng;
		}
	}
	if ( empty(gLoc.view.lat) ) {
		if ( !empty(gLocIPAddress.lat) ) {
			gLoc.view.lat = gLocIPAddress.lat;
			gLoc.view.lng = gLocIPAddress.lng;
			gLoc.view.city = gLocIPAddress.city;
			gLoc.view.country = gLocIPAddress.country;
			gLoc.view.zip = gLocIPAddress.zip;
			gLoc.view.latlng = "" + gLoc.view.lat + "," + gLoc.view.lng;
		}
	}
}

function receivePositionFromBrowser ( position )
{
	let field = document.getElementById ( "field_location" );
	let lat = position.coords.latitude;
	let lng = position.coords.longitude;
	let str = "" + lat + ", " + lng;
	/*
	if ( geoDistance(lat,lng,gLoc.view.lat,gLoc.view.lng) > 0.5 ) {	// compare where we are looking
		gLoc.curr.lat = lat;
		gLoc.curr.lng = lng;
		
		if ( !empty(gLoc.curr.lat) && !empty(gLoc.curr.lng) ) {
			if ( !gMap ) {
				mapInsert();
			}
			setTimeout ( getMoreCityData, 100 );
		}
	}
	*/
	if ( geoDistance(lat,lng, gLoc.curr.lat,gLoc.curr.lng) > 0.5 ) {	// compare where we are now
		gLoc.curr.lat = lat;
		gLoc.curr.lng = lng;
		if ( !empty(gLoc.curr.lat) && !empty(gLoc.curr.lng) ) {
			setTimeout ( refreshCityCurrent, 1800 );
		}
	}
	//field.innerHTML = str;
}

function findNearestTown ( lat, lng )
{
	let found = null;
	let closest = 9999;
	if ( !empty(gNearbyCities) && !empty(gNearbyCities.View.data) ) {
		let list = gNearbyCities.View.data;
		for ( let idx = 0; idx < list.length; idx++ ) {
			let town = list[idx];
			if ( !empty(town) ) {
				let distance = geoDistance ( lat, lng, town.latitude, town.longitude );
				if ( distance < closest ) {
					found = town;
					closest = distance;
				}
			}
		}
		if ( found ) {
			found.distanceFromView = closest;
			if ( closest > 100 ) found = null;
		}
	}
	return found;
}

var sCityDataRetries = 0;
var sLastNearest = "";
var sLastDistance = 0;

function updateLocationData ( lookUpCity=0 )
{
	let townChanged = 0;
	let distanceWandered = geoDistance ( sLastFetch.lat,sLastFetch.lng,gLoc.view.lat,gLoc.view.lng );
	let nearestTown = findNearestTown ( gLoc.view.lat, gLoc.view.lng );
	let distance = 0.0;
	if ( !empty(nearestTown) ) {
		distance = geoDistance ( gLoc.view.lat, gLoc.view.lng, nearestTown.latitude, nearestTown.longitude );
	}
	if ( empty(nearestTown) ) {
		gBigLocationChange = 1;
		getMoreCityData();
		setTimeout ( function() { updateLocationData(lookUpCity) }, 1500 );
		return;
	}
	if ( nearestTown.distanceFromView > 5 ) {
		let getMoreData = 0;
		gBigLocationChange = 1;
		// don't keep calling getMoreCityData if we keep getting the same data
		if ( sLastNearest != nearestTown.name ) getMoreData = 1;
		if ( sLastDistance != nearestTown.distanceFromView ) getMoreData = 1;
		//if ( now() - sLastFetch.date > 3 ) getMoreData = 1;
		if ( getMoreData ) {
			sLastNearest = nearestTown.name;
			sLastDistance = nearestTown.distanceFromView;
			getMoreCityData();
			setTimeout ( function() { updateLocationData(lookUpCity) }, 1500 );
			return;
		}
	}
	// VIEW first -- what we're actually looking at (home town)
	if ( lookUpCity && !empty(gNearbyCities.View.data) ) {
		if ( !empty(nearestTown) ) {
			if ( nearestTown.distanceFromView > distanceWandered ) {
				distanceWandered = nearestTown.distanceFromView;	// closest town is getting further away...
			}
			if ( nearestTown.distanceFromView < (2 * gMoreDataRadius) ) {
				if ( gLoc.view.city != nearestTown.name ) {
					//console.log ( `NEAREST TOWN: ${gLoc.view.name} -> ${nearestTown.name}` );
					gLoc.view.city = nearestTown.name;
					townChanged = 1;
				}
				if ( !empty(nearestTown.zip) && gLoc.view.zip != nearestTown.zip ) {
					//console.log ( `NEAREST  ZIP: ${gLoc.view.zip} -> ${nearestTown.zip}` );
					gLoc.view.zip = nearestTown.zip;
					townChanged = 1;
				}
			} else { // big change in location
				// don't do anything until we getMoreCityData() because we don't know where we are, really...
				//gLoc.view.city = "Finding...";
				//gLoc.view.zip = "";
				gBigLocationChange = 1;
				updateLocationUI();
				getMoreCityData();
				if ( sCityDataRetries++ < 10 ) {
					setTimeout ( function() { updateLocationData(lookUpCity) }, 1500 );
				}
				//return;
			}
		}
		//if ( geoDistance(gLoc.view.lat, gLoc.view.lng, nearestTown.lat, nearestTown.lng) > gMoreDataRadius ) {
		//if ( nearestTown.distance > 10 ) {
		if ( townChanged ) {
			if ( !empty(nearestTown.region) ) 		gLoc.view.region = nearestTown.region;
			if ( !empty(nearestTown.population) )	gLoc.view.population = nearestTown.population;
			if ( !empty(nearestTown.countryCode) )	gLoc.view.country = nearestTown.countryCode;
			// https://www.wikidata.org/wiki/Q169943
			if ( !empty(nearestTown.wikiDataId) ) 	gLoc.view.wikiDataId = nearestTown.wikiDataId;
			if ( !empty(nearestTown.zip) && gLoc.view.zip != nearestTown.zip ) {
				gLoc.view.zip = nearestTown.zip;
				/*
				if ( !gLocalTest ) {
					gData.refreshZipCode = 1;
					if ( gData.timer ) clearTimeout ( gData.timer );
					gData.timer = setTimeout(function() {
						refreshFeedData ( DATA_FORCE );
					}, 3000);
				}
				*/
			}
		}
	} else {
		if ( !empty(nearestTown) ) {
			if ( !empty(nearestTown.region) ) 		gLoc.view.region = nearestTown.region;
			if ( !empty(nearestTown.population) )	gLoc.view.population = nearestTown.population;
			// https://www.wikidata.org/wiki/Q169943
			if ( !empty(nearestTown.wikiDataId) ) 	gLoc.view.wikiDataId = nearestTown.wikiDataId;
		}
	}
			if ( gData.timer ) clearTimeout ( gData.timer );
			gData.timer = setTimeout(function() {
				locationSettled();
			}, 3500);

	if ( distanceWandered > gMoreDataRadius ) {
		getMoreCityData();
	}
	if ( gBigLocationChange ) {
		if ( typeof refreshFeedData === "function" ) {
			refreshFeedData ( DATA_FORCE );
		}
		gBigLocationChange = 0;
	}
	// CURR location (browser, IP address, where you physically are located)
	if ( !empty(gNearbyCities.Curr.data) ) {
		let nearestTown = gNearbyCities.Curr.data[0];
		if ( !empty(nearestTown) ) {
			if ( nearestTown.name != gLoc.curr.city ) {
				gLoc.curr.city = nearestTown.name;
				if ( gLoc.curr.city != gLoc.view.city ) {	// we are not currently where we're viewing
					if ( !empty(nearestTown.region) ) {
						gLoc.curr.region = nearestTown.region;
					}
					if ( !empty(nearestTown.zip) && gLoc.curr.zip != nearestTown.zip ) {
						gLoc.curr.zip = nearestTown.zip;
					}
				}
			}
		}
	}
	sCityDataRetries = 0;
	//if ( townChanged ) {
		updateLocationUI();
	//}
}

//var gLocHistory = [];		// see main_setup.php

function findLocInHistory ( zip )
{
	let found = null;
	
	for ( let idx = 0; idx < gLocHistory.length; idx++ ) {
		let rec = gLocHistory[idx];
		if ( zip == rec.zip ) {
			if ( !empty(rec.lat) && !empty(rec.lng) ) {
				found = rec;
				break;
			}
		}
	}
	return found;
}

function rememberLocation ( view )
{
	//let now = now() / 1000;
	let city = "";
	let already = null;
	if ( !empty(view.city) ) city = view.city;
	//if ( !empty(view.name) ) city = view.name;
	let rec = { 'lat':view.lat, 'lng':view.lng, 'city':city, 'zip':view.zip, 'date':now() };
	for ( let idx = 0; idx < gLocHistory.length; idx++ ) {
		let ex = gLocHistory[idx];
		if ( ex.city == city && ex.zip == view.zip ) {
			already = ex;
			gLocHistory.splice(idx, 1);	// remove duplicate
			break;
		}
	}
	gLocHistory.push ( rec );
	return rec;
}

function locationSettled()
{
	if ( typeof refreshFeedData === "function" ) {
		refreshFeedData ( DATA_FORCE );
	}
	//sLastFetch = rememberLocation ( gLoc.view );
	//updateLocationUI();
}

var sLastLat = 0, sLastLng = 0;
var sLastCityRequest = 0;

function getMoreCityData()
{

	if ( !empty(sLastFetch) && !empty(sLastFetch.date) ) {
		if ( now() - sLastFetch.date < 3000 ) return;
	}
	//update city list
	getCityDataFromServer ( "View", gLoc.view.lat, gLoc.view.lng, 0 );

	if ( gLoc.view.lat != sLastLat || gLoc.view.lng != sLastLng ) {
		//console.log ( `getMoreCityData: ${gLoc.view.lat}, ${gLoc.view.lng}` );
		sLastLat = gLoc.view.lat;
		sLastLng = gLoc.view.lng;
	}

	//if ( sLastFetch.name != gLoc.view.city ) {
	/*
		if ( (now - sLastFetch.date) > 4 ) {
			if ( gData.timer ) clearTimeout ( gData.timer );
			gData.timer = setTimeout(function() {
				refreshFeedData ( DATA_FORCE );
			}, 1000);
			sLastFetch.name = gLoc.view.city;
			sLastFetch.date = now;
		}
	//}
	*/
	sLastFetch.lat = gLoc.view.lat;
	sLastFetch.lng = gLoc.view.lng;
	sLastFetch.date = now();
}

function refreshCityCurrent()
{
	getCityDataFromServer ( "Curr", gLoc.curr.lat, gLoc.curr.lng, gLoc.curr.zip );
}

function haveCity ( list, look )
{
	let have = 0;
	for ( let idx = 0; idx < list.length; idx++ ) {
		let rec = list[idx];
		if ( rec.city == look.city && rec.zip == look.zip ) {
			//console.log ( `Already have ${look.zip} ${look.city}` );
			have = 1;
			break;
		}
	}
	return have;
}

function updatePinData ( data )
{
	if ( !empty(data) ) {
		let rec = null;
		if ( !empty(data.latitude) && !empty(data.longitude) ) {
			let label = data.addr1 ? data.addr1 : data.city;
			rec = [ label, data.latitude, data.longitude, data.zip ];
		} else if ( !empty(data.lat) && !empty(data.lng) ) {
			let label = data.addr1 ? data.addr1 : data.city;
			if ( !empty(data.lastName) ) {
				label = `${data.firstName} ${data.lastName}`;
			}
			rec = [ label, data.lat, data.lng, data.zip ];
		}
		//gMapPinData.push ( rec );
		addPinToMap ( rec );
	}
}

function mergeCityData ( where, list )
{
	let data = gNearbyCities[where].data;
	if ( !empty(data) ) {
		gNearbyCities[where].data = list;
		for ( let idx = 0; idx < list.length; idx++ ) {
			let rec = list[idx];
			if ( rec.zip == '96799' ) {
				let bp = 1;
			}
			updatePinData ( rec );
		}
		return;
	}
	/*
	for ( let idx = 0; idx < list.length; idx++ ) {
		let rec = list[idx];
		if ( !haveCity(data, rec) ) {
			data.push ( rec );
			updatePinData ( rec );
			//console.log ( `Adding NEW CITY ${rec.zip} ${rec.city}` );
		}
	}
	*/
}

function havePerson ( look )
{
	let have = 0;
	let list = sPersonPinList;
	for ( let idx = 0; idx < list.length; idx++ ) {
		let rec = list[idx];
		//if ( rec.recID == look.recID ) {
		if ( !empty(rec.latitude) && !empty(look.latitude) ) {
			if ( rec.latitude == look.latitude && rec.longitude == look.longitude ) {
				have = 1; break;
			}
		}
		if ( !empty(rec.lat) && !empty(look.lat) ) {
			if ( rec.lat == look.lat && rec.lng == look.lng ) {
				have = 1; break;
			}
		}
	}
	return have;
}

function displayPeopleOnMap ( list, append=0, selectedOnly=0 )
{
	let goto = 1;
	if ( append ) goto=0;

	for ( let idx = 0; idx < list.length; idx++ ) {
		let rec = list[idx];
		const persID = rec.userID;
		if ( selectedOnly && empty(gSelected[persID]) ) {
			continue;
		}
		if ( !havePerson(rec) ) {
			sPersonPinList.push ( rec );
			updatePinData ( rec );
			if ( goto && !empty(rec['lat']) && !empty(rec['lng']) ) {
				gotoMapLoc ( rec['lat'], rec['lng'], 12 );
				goto = 0;
			}
			//console.log ( `Adding NEW CITY ${rec.zip} ${rec.city}` );
		}
	}
	console.log ( `displayed ${sPersonPinList.length} pins of ${list.length} records` );
}

function geoDistance ( lat1, lng1, lat2, lng2 )
{
  let R = 3959; // Radius of the earth in miles
  let dLat = deg2rad(lat2-lat1);
  let dLng = deg2rad(lng2-lng1);
  let a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
    Math.sin(dLng/2) * Math.sin(dLng/2);
  let c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  let d = R * c; // Distance in km
  return d;
}

function deg2rad(deg) {
  return deg * (Math.PI/180)
}


