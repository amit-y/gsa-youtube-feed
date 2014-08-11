exports.ytapiURL = function(method, params) {
  var _url = 'https://www.googleapis.com/youtube/v3/';
  if (method) _url+=method+'?';

  if (params) {
    for (var param in params) {
      _url+=param+'='+params[param]+'&'
    }
  }

  if (_url.slice(-1)==='&') _url=_url.slice(0,-1);

  return _url;
}