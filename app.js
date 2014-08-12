/*

*/
var Q = require('q'),
    request = require('request'),
    utils = require('./utils'),
    config = require('./config.json'),
    videos = [],
    appQ, channel, totalResults, nextPageToken,
    channelsListURL = utils.ytapiURL('channels', {
      part:'contentDetails', 
      forUsername:config.forUsername, 
      key:config.key
    });

appQ = Q(ytapiRequest(channelsListURL))

.then(function (channels) {
  channel = channels.items[0].contentDetails.relatedPlaylists.uploads;
  return parsePlaylistItems()/*.then(function(playlistItems) {
    

  })).then(parsePlaylistItems(channels, nextPageToken)).then(function(data) { console.log(data); })*/
    
    /*
    console.log(moreReqs);
    parsePlaylistItems(channels.nextPageToken).then(function(playlistItems) {
      console.log(playlistItems);
    });

    if (videos.length < totalResults) {
      //console.log('more videos to parse');
      return parsePlaylistItems(channels, nextPageToken).then(function(playlistItems) {
        //nextPageToken = playlistItems.nextPageToken;
        //console.log('videos got: '+playlistItems.length);
        //addPlaylistItemVideos(playlistItems)
      });
    } */ 

})

.then(function() {
    
    //totalResults = playlistItems.totalResults;
    //nextPageToken = playlistItems.nextPageToken;
    //moreReqs = Math.ceil((totalResults-50)/50);
    //return addPlaylistItemVideos(playlistItems.items);
})
/*
for (var fetchloop = 0; fetchloop < 2; fetchloop++) {
appQ.then(function() {
  return parsePlaylistItems(channels, nextPageToken);
})

appQ.then(function(playlistItems) {
  nextPageToken = playlistItems.nextPageToken;
  return addPlaylistItemVideos(playlistItems.items);
})
}*/

//appQ.delay(10000).then(function() { console.log(videos.length); });;


appQ.done(function() {
  console.log(videos.length);
})

//appQ.done(function() {});

appQ.fail(function (err) {
  console.log(err);
});



function ytapiRequest(url) {
  return Q.Promise(function(resolve, reject) {
    request(url, function(err, response, body) {
      if (err) reject(err);
      if (response.statusCode!=200) reject(new Error('Unsuccessful response code!'));

      resolve(JSON.parse(body));
    });
  });
}

function parsePlaylistItems() {
  var deferred = Q.defer(),
  playlistItemsParams = {
    part:'snippet', 
    maxResults: 50,
    playlistId:channel, 
    key:config.key
  };
  if (nextPageToken) playlistItemsParams.pageToken = pageToken;
  var playlistItemsURL = utils.ytapiURL('playlistItems', playlistItemsParams); //console.log(playlistItemsURL);
  ytapiRequest(playlistItemsURL).then(function (playlistItems) {
    //totalResults = playlistItems.pageInfo.totalResults;
    nextPageToken = (playlistItems.nextPageToken) ? playlistItems.nextPageToken : '';
    return addPlaylistItemVideos(playlistItems.items);
  }).then(function() { 
    deferred.resolve(); 
    /*
    console.log(Boolean(nextPageToken));
    if (Boolean(nextPageToken)) {
      return parsePlaylistItems();
    } else {
      
    }*/
  });

  return deferred.promise;
}

var addPlaylistItemVideos = function (playlistItems) {
  var deferred = Q.defer();
  for (var v = 0, maxV = playlistItems.length; v < maxV; v++) {
    videos.push({
      id: playlistItems[v].snippet.resourceId.videoId,
      title: playlistItems[v].snippet.title,
      description: playlistItems[v].snippet.description,
      thumbnails: {
        default: playlistItems[v].snippet.thumbnails.default
      }
    });
  } //console.log('maxV: '+maxV);
  deferred.resolve();
  return deferred.promise;
};