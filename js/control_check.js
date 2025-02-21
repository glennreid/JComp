function control_check()
{
	var getUrl = '/php/check_control.php?module='+gModule;
	jQuery.ajax({url:getUrl,  dataType:'json',
		success:function(data) {
			var version = parseInt(data['version']);
			if ( gModuleVersion > 0 && gModuleVersion != version ) {
				gModuleVersion = version;
				reload_page();
			}
			gModuleVersion = version;
			if ( data['heartbeatControl'] != undefined ) {
				gControlHeartbeat = data['heartbeatControl'];
			}
			setTimeout(control_check, gControlHeartbeat * 1000);
		},
		error: function(XMLHttpRequest, textStatus, errorThrown) {
			//alert('get_status: ' + errorThrown + " / " + textStatus);
			console.log('get_status: ' + errorThrown + " / " + textStatus);
			setTimeout(control_check, gControlHeartbeat * 1000 * 2);
		}
	});
}

