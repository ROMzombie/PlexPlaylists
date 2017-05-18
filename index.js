var	config = require("./config"),
	http = require("http-request"),
	express = require("express"),
	app = express(),
 	PlexAPI = require("plex-api"),
	api = new PlexAPI({ 
		hostname: config.plex_address, 
		username: config.plex_username, 
		password: config.plex_password,
		port: config.plex_port,
		options: { 
			deviceName: "Plex Playlists",
			identifier: "plex-playlists",
			product: "Plex Playlists" 
		} });

app.set("view engine", "pug");

// Serve static files
app.use(express.static('build/default'));
app.use(express.static('images'));

app.get("/api/server", function(req, res){
	res.json({
		serverName: config.server_name,
		plexAddress: config.plex_address,
		plexPort: config.plex_port,
		serverId: config.server_id
	});
});

app.get("/api/playlists", function(req, res){
	getPlaylists().then(function(result){ 
		res.json(result);
	});
});

app.get("/api/playlist/:id", function(req, res){
	getPlaylistItems(req.params.id).then(function(result){ 
		res.json(result);
	});
});

app.get("/api/image", function(req,res){
	getImageFromPlexPy(req.query.key).then(function(result){
		res.setHeader("content-type","image/jpg");
		res.write(result);
		res.end();
	});
});

// Allow Polymer routing
app.get('*', function(req, res){ 
  res.sendFile("build/default/index.html", {root: '.'});
});

app.listen(config.service_port);

function getPlaylists() {
	return api.query("/playlists").then(function(result){  
		return result.MediaContainer.Metadata.filter(function(entry){
			return entry.title.startsWith(config.prefix);
		});
	}, function(error){
		console.error("Could not connect to server", error) 
	});	
}

function getPlaylistItems (id) {
	if(id == null){ return; }
	
	var key = "/playlists/" + id + "/items";

	return api.query(key).then(function(result){               
		return { 
			title: result.MediaContainer.title,
			items: result.MediaContainer.Metadata 
		};
	}, function(error){
		console.error("Could not get playlist entries");
	});	
}

function getImageFromPlexPy(key) {
	return new Promise(function(resolve, reject){
		var url = "http://" 
			+ config.plexpy_address + ":" + config.plexpy_port 
			+ "/api/v2?apikey=" + config.plexpy_apikey 
			+ "&cmd=pms_image_proxy&img=" + key
			+ "&fallback=poster"
		http.get(url, function(error, response){
			resolve(response.buffer);
		});
	});
}
