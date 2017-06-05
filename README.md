# PlexPlaylists
A tool for sharing curated content via a Plex server.

## Dependencies
1. A Plex server
2. A PlexPy server connected to that Plex server
3. NodeJS

## Setup
1. cp _config.json config.json 
2. nano config.json
   (populate it with your configuration settings)
3. npm install

## Usage
Add playlists to your server annotated by a '@' to share them. You can also specify a category via one of these terms (dynamic, collection, filmography or organized), seperated from the playlist title by a pipe character (|).  
For example, in the screenshots below, the name for the first playlist is "@collection|Tom's Favorites".

The application uses an in-memory cache to prevent successive hits to PlexPy (for images) and the Plex server within a period of a few hours.

## Running
1. nodejs .

## Rebuilding UI
1. npm install -g polymer-cli
2. bower install
3. polymer build

## Screenshots
![Playlists](http://i.imgur.com/DVkXsJE.png)
![Items](http://i.imgur.com/QV64kmx.png)
