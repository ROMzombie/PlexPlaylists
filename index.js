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

// files in '/src' will be served from root
app.use(express.static('src'));

app.get("/", function(req, res){
	getPlaylists().then(function(result){ 
		res.render("index", { 
			serverName: config.server_name,
			plexAddress: config.plex_address,
			plexPort: config.plex_port,
			playlists: result 
		});
	});
});

app.get("/playlist/:id", function(req, res){
	getPlaylistItems(req.params.id).then(function(result){ 
		res.render("playlist", { 
			serverName: config.server_name,
			plexAddress: config.plex_address,
			serverId: config.server_id,
			plexPort: config.plex_port,
			playlistName: result.playlistName,
			items: result.items });
	});
});

app.get("/image", function(req,res){
	getImageFromPlexPy(req.query.key).then(function(result){
		res.setHeader("content-type","image/jpg");
		res.write(result);
		res.end();
	});
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
			playlistName: result.MediaContainer.title,
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
			//+ "&width=150&height=255" 
			+ "&fallback=poster"
		http.get(url, function(error, response){
			resolve(response.buffer);
		});
	});
}
