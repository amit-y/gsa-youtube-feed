/*

*/
var Q = require('q'),
    request = require('request'),
    utils = require('./utils'),
    config = require('./config.json'),
    videos = [],
    appQ, channels, totalResults, nextPageToken,
    channelsListURL = utils.ytapiURL('channels', {
      part:'contentDetails', 
      forUsername:config.forUsername, 
      key:config.key
    });

appQ = Q(ytapiRequest(channelsListURL))

.then(function (chnl) {
  channels = chnl;
  return parsePlaylistItems(channels).then(function(playlistItems) {
    
    addPlaylistItemVideos(playlistItems.items);
    totalResults = playlistItems.totalResults;
    nextPageToken = playlistItems.nextPageToken;
    console.log(playlistItems.nextPageToken);
  })
})

appQ.then(function() {
  if (videos.length < totalResults) {
    //console.log('more videos to parse');
    return parsePlaylistItems(channels, nextPageToken).then(function(playlistItems) {
      console.log(playlistItems.nextPageToken);
      addPlaylistItemVideos(playlistItems);
    });
  }  
})


appQ.then(function() {
  console.log(videos.length);
})

appQ.done(function() {});

appQ.fail(function (err) {
  console.log(err);
});

/*
ytapiRequest(channelsListURL).then(function (channels) { 
  
.then(function() {

  });
}).catch(null, function (err) {
  console.log(err);
});
*/

function ytapiRequest(url) {
  return Q.Promise(function(resolve, reject) {
    request(url, function(err, response, body) {
      if (err) reject(err);
      if (response.statusCode!=200) reject(new Error('Unsuccessful response code!'));

      resolve(JSON.parse(body));
    });
  });
}

function parsePlaylistItems(channels, pageToken) {
  var deferred = Q.defer(),
  playlistItemsParams = {
    part:'snippet', 
    maxResults: 50,
    playlistId:channels.items[0].contentDetails.relatedPlaylists.uploads, 
    key:config.key
  };
  if (pageToken) playlistItemsParams.pageToken = pageToken;
  var playlistItemsURL = utils.ytapiURL('playlistItems', playlistItemsParams);
  ytapiRequest(playlistItemsURL).then(function (playlistItems) {
    deferred.resolve({totalResults: playlistItems.pageInfo.totalResults, 
      nextPageToken: playlistItems.nextPageToken, items: playlistItems.items});
  });

  return deferred.promise;
}

function addPlaylistItemVideos(playlistItems) {
  for (var v = 0, maxV = playlistItems.length; v < maxV; v++) {
    videos.push({
      id: playlistItems[v].snippet.resourceId.videoId,
      title: playlistItems[v].snippet.title,
      description: playlistItems[v].snippet.description,
      thumbnails: {
        default: playlistItems[v].snippet.thumbnails.default
      }
    });
  }
  return;
}