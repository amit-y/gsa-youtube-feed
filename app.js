/*

*/
var Q = require('q'),
    fs = require('fs'),
    handlebars = require('handlebars'),
    request = require('request'),
    utils = require('./utils'),
    config = require('./config.json'),
    videos = [],
    appQ, channel, nextPageToken, noMoreItems,
    channelsListURL = utils.ytapiURL('channels', {
      part:'contentDetails', 
      forUsername:config.forUsername, 
      key:config.key
    });

appQ = Q(ytapiRequest(channelsListURL))

.then(function (channels) {
  channel = channels.items[0].contentDetails.relatedPlaylists.uploads;
  return loopPlaylistItemsCall();
})

.then(function() {
    //console.log(videos[0]);
    //return Q.nfcall(fs.readFile, 'feed_template.xml', 'utf-8');
    return Q.nfcall(fs.readFile, 'html_template.html', 'utf-8');
})

.then(function(feedsrc) {
  //var feed = handlebars.compile(feedsrc);
  //var data = {videos: videos};
  //return feed(data);
  return pages(feedsrc);
})

.then(function(fd) {
  //console.log(fd);
  //return postFeed('http://posttestserver.com/post.php?dir=myfeedexample','test','test',new Buffer('test','utf-8'));
})

.then(function(postresp) {
  //console.log(postresp);
})

appQ.done(function() {
  console.log(videos[0]);
  console.log('done!');
})

//appQ.done(function() {});

appQ.fail(function (err) {
  console.log(err);
});

function loopCreatePage(src, v) {
  var deferred = Q.defer();
  var vf = videos[v].id;
  var page = createPage(videos[v], src).then(function(videoPage) {
    return Q.nfcall(fs.writeFile, 'videos/'+vf+'.html', videoPage, 'utf-8')
  })
  page.done(function() {
    deferred.resolve();
  })
  
  //Q.nextTick(loop);
  return deferred.promise;
}

function pages(src) {
    var deferred = Q.defer();
    var v=-1;
    noMoreItems = false;

    function loop() {
        if (noMoreItems) return deferred.resolve();
        v++;
        Q.when(loopCreatePage(src, v), loop, deferred.reject);
    }

    Q.nextTick(loop);
    return deferred.promise;
}

function createPage(video, src) {
  var deferred = Q.defer();
  var html = handlebars.compile(src);
  var data = {id: video.id, title: video.title, description: video.description, bite: video.bite, thumbnails: video.thumbnails, videos: videos};
  deferred.resolve(html(data));
  return deferred.promise;
}

function postFeed(url,datasource,feedtype,data) {
  return Q.Promise(function(resolve, reject) {
    var post = request.post(url, function(err, response, body) {
      if (err) reject(err);

      resolve(body);
    });

    var form = post.form();
    form.append('datasource', datasource);
    form.append('feedtype', feedtype);
    form.append('data', data);
  });
}

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
  if (nextPageToken) playlistItemsParams.pageToken = nextPageToken;
  var playlistItemsURL = utils.ytapiURL('playlistItems', playlistItemsParams);
  ytapiRequest(playlistItemsURL).then(function (playlistItems) {
    nextPageToken = (playlistItems.nextPageToken) ? playlistItems.nextPageToken : '';
    if (!Boolean(nextPageToken)) noMoreItems = true;
    return addPlaylistItemVideos(playlistItems.items);
  }).then(function() {
    deferred.resolve(); 
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
      bite: playlistItems[v].snippet.description.replace(/\s+/g, ' '),
      thumbnails: {
        default: playlistItems[v].snippet.thumbnails.default
      }
    });
  }
  deferred.resolve();
  return deferred.promise;
};

function loopPlaylistItemsCall() {
    var deferred = Q.defer();

    function loop() {
        if (noMoreItems) return deferred.resolve();
        Q.when(parsePlaylistItems(), loop, deferred.reject);
    }

    Q.nextTick(loop);
    return deferred.promise;
}

