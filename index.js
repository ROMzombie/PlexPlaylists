var	config = require("./config"),
	http = require("http-request"),
	express = require("express"),
	app = express(),
 	PlexAPI = require("plex-api"),
	cache = require("memory-cache"),
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

var 	PLAYLIST_CACHE_DURATION = 1000*60*60, // 1h
	IMAGE_CACHE_DURATION = 1000*60*60*24; // 24h 

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

app.get("/api/playlist/:id/thumbnail", function(req, res){
	var timestamp = Math.round((new Date()).getTime() / 1000);
	getImageFromPlexPy("/playlists/"+req.params.id+"/composite/"+timestamp).then(function(result){
		res.setHeader("content-type","image/jpg");
		res.write(result);
		res.end();
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
	var cachedPlaylists = cache.get("playlists");
	if(cachedPlaylists){
		return Promise.resolve(cachedPlaylists);
	} else {
		return api.query("/playlists").then(function(result){  
		  var results = result.MediaContainer.Metadata.filter(function(entry){
			return entry.title.startsWith(config.prefix);
		  });
		  cache.put("playlists", results, PLAYLIST_CACHE_DURATION);
		  return results;
		}, function(error){
		  console.error("Could not connect to server", error) 
		});
	}	
}

function getPlaylistItems (id) {
	if(id == null){ return; }
	
	var key = "/playlists/" + id + "/items";

	var cachedPlaylist = cache.get("playlist_"+key);
	if(cachedPlaylist) {
		return Promise.resolve(cachedPlaylist);
	} else {
		return api.query(key).then(function(result){               
		  var result = { 
			title: result.MediaContainer.title,
			items: result.MediaContainer.Metadata 
		  };
		  cache.put("playlist_"+key, result, PLAYLIST_CACHE_DURATION);
		  return result;
		}, function(error){
		  console.error("Could not get playlist entries");
		});
	}	
}

function getImageFromPlexPy(key) {
	var cacheKey = key;
	if(cacheKey.startsWith('/playlists')){
		cacheKey = /(.*\/composite\/)/i.exec(key)[0]; 
	}
	var cachedImage = cache.get("image_"+cacheKey);
	if(cachedImage){
		return Promise.resolve(cachedImage);
	} else {
		return new Promise(function(resolve, reject){
		  var url = "http://" 
			+ config.plexpy_address + ":" + config.plexpy_port 
			+ "/api/v2?apikey=" + config.plexpy_apikey 
			+ "&cmd=pms_image_proxy&img=" + key
			+ "&fallback=poster"
		  http.get(url, function(error, response){
			var buffer = response.buffer;
			cache.put("image_"+cacheKey, buffer, IMAGE_CACHE_DURATION);	
			resolve(buffer);
		  });
		});
	}
}
