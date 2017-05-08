var	config = require("./config"),
	express = require("express"),
	app = express(),
 	PlexAPI = require("plex-api"),
	api = new PlexAPI({ 
		hostname: config.plex_address, 
		username: config.plex_username, 
		password: config.plex_password,
		options: { 
			deviceName: "Plex Playlists",
			identifier: "plex-playlists",
			product: "Plex Playlists" 
		} });

app.set("view engine", "pug");

app.get("/", function(req, res){
	res.render("index", {} );
});

app.get("/playlists", function(req, res){
	getPlaylists.then(function(result){ res.json(result); });
});

app.get("/playlist/:id", function(req, res){
	getPlaylist(req.params.id).then(function(result){ res.json(result); });
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
	if(playlist == null){ return; }
	
	var key = "/playlists/" + id + "/items";

	return api.query(key).then(function(result){
		return result.MediaContainer.Metadata;
	}, function(error){
		console.error("Could not get playlist entries");
	});	
}
