
/*
 * 2/12/2023
 *
 * groups.js
 *
 * Support functions for ZIPit cards
 */

var gYouTubeInitialized = 0;
var gYouTubePlayers = [];

function isYouTube ( link )
{
	if ( link.includes("//youtu.be/") ) return true;
	if ( link.includes("//youtube.com/") ) return true;
	if ( link.includes("//www.youtube.com/") ) return true;
	return false;
}

function make_youtube_embed ( postID, link )
{
	var html = "";
	var embedLink = link;
	if ( link.includes("youtu.be/") )
		embedLink = link.replace("youtu.be/", "youtu.be/embed/");
	if ( link.includes("youtube.com/") )
		embedLink = link.replace("tube.com/", "tube.com/embed/")

	html += "  <div class='image' width='100%' height='auto'>";
	html += "    <iframe width='100%' height='300'";		// <iframe width="560" height="315"
	html += "      id='iframe-" + postID + "'";
	html += "      src='" + embedLink + "'";
	html += "      title='YouTube video player'";
	html += "      frameborder='0'";
	html += "      allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share'";
	html += "      allowfullscreen>";
	html += "    </iframe>";
	html += "  </div>\n";

	var videoID = extractVideoID ( embedLink );
	var player = { 'videoID': videoID, 'iframe': "iframe-" + postID };
	gYouTubePlayers.push ( player );
	
	return html;
}

function extractVideoID ( link )
{
	var result = null;
	
	if ( !empty(link) ) {
		var pieces = link.split("v=");
		if ( pieces.length > 1 ) {
			result = pieces[1];
			//var args = link.indexOf('?');
			//if ( args > 1 ) result = result.substring(0,args-1);
		}
	}
	
	return result;
}

function findPlayerIdx ( iframe )
{
	var found = -1;
	for ( var idx = 0; idx < gYouTubePlayers.length; idx++ ) {
		var rec = gYouTubePlayers[idx];
		if ( !empty(rec) ) {
			if ( !empty(rec.player) ) {
				found = idx;
				break;
			}
		}
	}
	return found;
}

function resetYouTubePlayers()
{
	gYouTubeInitialized = 0;
	gYouTubePlayers = [];
}

function tellYouTubeWeAreReady()
{
	if ( !gYouTubeInitialized ) {
        $.getScript ( "https://www.youtube.com/iframe_api", function() {
            // once loaded, create the onYouTubeIframeAPIReady function
            window.onYouTubeIframeAPIReady = function() {
				/*
                queue.forEach(function($video) {
                    // Create the YT player
                    var player = new YT.Player($video.get(0), {
                        'width': "100%",
                        'height': "100%",
                        'videoId': $video.data("id")
                    });
                    // add to players array
                    players.push(player);
                });
                */
				for ( var idx = 0; idx < gYouTubePlayers.length; idx++ ) {
					var rec = gYouTubePlayers[idx];
					if ( !empty(rec) ) {
						var player = new YT.Player ( rec.iframe, {
							height: '390',
							width: '640',
							videoId: rec.videoID,
							playerVars: {
								'playsinline': 1
							},
							events: {
							'onReady': onPlayerReady,
							'onStateChange': onPlayerStateChange
							}
						});
						gYouTubePlayers[idx].player = player;
					}
				}
            };
        });
		gYouTubeInitialized = 1;
	}
}

function myReady()
{
}

// 4. The API will call this function when the video player is ready.
function onPlayerReady(event) {
	var iframe = event.target;
	var playerIdx = findPlayerIdx ( iframe );
	if ( playerIdx >= 0 ) {
		gYouTubePlayers[idx].playing = true;
	}
	event.target.playVideo();
}

// 5. The API calls this function when the player's state changes.
//    The function indicates that when playing a video (state=1),
//    the player should play for six seconds and then stop.
var done = false;
function onPlayerStateChange(event) {
	if (event.data == YT.PlayerState.PLAYING && !done) {
	  setTimeout(stopVideo, 6000);
	  done = true;
	}
}

function stopVideo()
{
	gYouTubePlayer.stopVideo();
}

/* from StackOverflow
<div id="ytplayer1"></div>
<div id="ytplayer2"></div>

<script>
  var player;
  var player2;
  function onYouTubePlayerAPIReady() {
    player = new YT.Player('ytplayer1', {
      height: '390',
      width: '640',
      videoId: 'hdy78ehsjdi'
    });
    player2 = new YT.Player('ytplayer2', {
      height: '390',
      width: '640',
      videoId: '81hdjskilct'
    });
  }
</script>

*/

