var	config = require("./config"),
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

var 	lastUpdated = 0, 
	playlists = {}, 
	playlistItems = [];

app.set("view engine", "pug");

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

app.listen(config.service_port);

function getPlaylists() {
	if(needsRefreshed()) {	
		return api.query("/playlists").then(function(result){  
			return playlists = result.MediaContainer.Metadata.filter(function(entry){
				return entry.title.startsWith(config.prefix);
			});
		}, function(error){
			console.error("Could not connect to server", error) 
		});
	} else {
		return playlists;
	}	
}

function getPlaylistItems (id) {
	if(id == null){ return; }
	
	var key = "/playlists/" + id + "/items";

	if(needsRefreshed()){
		return api.query(key).then(function(result){
			return playlistItems[key] = { 
				playlistName: result.MediaContainer.title,
				items: result.MediaContainer.Metadata 
			};
		}, function(error){
			console.error("Could not get playlist entries");
		});
	} else {
		return playlistItems[key];
	}	
}

function needsRefreshed() {
	return lastUpdated < (new Date() - 100*60*5);
}
