var bodyParser = require('body-parser');
var express = require('express');
var app = require('express')(),
    Promise = require('bluebird'),
    request = Promise.promisifyAll(require('request'), {
        multiArgs: true
    });



// parse application/json
app.use(bodyParser.json())

// Add headers
app.use(function (req, res, next) {

    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', '*');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);

    // Pass to next layer of middleware
    next();
});


app.get('/action', function (req, res) {
    var action = req.query.action;
    var query = req.query.query;
    var bodyGoogle = {
        type: "",
        query: ""
    };
    console.log('Request to /action made at ' + action);
    switch (action) {
        case 'spotify':
            var opt = {
                uri: 'https://refinedsearch-api.mybluemix.net/whatsound/api/v1/refine/values?search=' + query,
                Method: "GET"
            }

            function call(error, response, body) {
                if (!error && response.statusCode == 200) {
                    var info = responseFix(body);
                    bodyGoogle.type = info.type
                    bodyGoogle.query = info.query;
                    var options = {
                        uri: 'https://music-api.mybluemix.net/whatsound/api/v1/spotify/' + bodyGoogle.type + '/values?query=' + bodyGoogle.query,
                        Method: "GET"
                    }
                    request(options, callback);
                } else {
                    console.log('spotify error : ' + JSON.stringify(spotBody));
                }
            }

            function callback(error, response, spotBody) {
                if (!error && response.statusCode == 200) {
                    spotBody = responseFix(spotBody);
                    spotBody.typeGoogle = bodyGoogle.type;
                    res.send(spotBody);
                } else {
                    console.log('spotify error : ' + JSON.stringify(spotBody));
                }
            }
            request(opt, call);
            break;
        case 'youtube':
            var opt1 = {
                uri: 'https://refinedsearch-api.mybluemix.net/whatsound/api/v1/refine/values?search=' + query,
                Method: "GET"
            }

            function call1(error, response, body) {
                if (!error && response.statusCode == 200) {
                    var info = responseFix(body);
                    bodyGoogle.type = info.type;
                    bodyGoogle.query = info.query;
                    if (bodyGoogle.type == "artist" || bodyGoogle.type == "track" || bodyGoogle.type == "album") {
                        bodyGoogle.query = info.query;
                        var options1 = {
                            uri: 'https://video-api.mybluemix.net/whatsound/api/v1/youtube/clip/values?query=' + bodyGoogle.query,
                            Method: "GET"
                        }
                        request(options1, callback1);
                    }

                } else {
                    console.log('spotify error : ');
                }
            }

            function callback1(error, response, youtubeBody) {
                if (!error && response.statusCode == 200) {
                    youtubeBody = responseFix(youtubeBody);
                    res.send(youtubeBody);
                } else {
                    console.log('Youtube error : ' + JSON.stringify(youtubeBody));
                }
            }
            request(opt1, call1);
            break;
        case 'lyrics':
            var opt2 = {
                uri: 'https://refinedsearch-api.mybluemix.net/whatsound/api/v1/refine/values?search=' + query,
                Method: "GET"
            }

            function call2(error, response, body) {
                if (!error && response.statusCode == 200) {
                    var info = responseFix(body);
                    if (bodyGoogle.type != "artist" || bodyGoogle.type != "track" || bodyGoogle.type != "album") {
                        bodyGoogle.query = info.query;
                        bodyGoogle.track = (JSON.stringify(bodyGoogle.query)).split("+")[0];
                        bodyGoogle.artist = (JSON.stringify(bodyGoogle.query)).split("+")[1];
                        var options2 = {
                            uri: 'https://lyrics-api.mybluemix.net/whatsound/api/v1/vagalume/lyrics/values?track=' + bodyGoogle.track + '&artist=' + bodyGoogle.artist,
                            Method: "GET"
                        }
                        request(options2, callback2);
                    }

                } else {
                    console.log('Lyrics error : ');
                }
            }

            function callback2(error, response, lyricsBody) {
                if (!error && response.statusCode == 200) {
                    lyricsBody = responseFix(lyricsBody);
                    res.send(lyricsBody);
                } else {
                    console.log('Lyrics error : ' + JSON.stringify(lyricsBody));
                }
            }
            request(opt2, call2);
            break;
        case 'toptracks':
            var trackList = [];
            var urlList = [];
            var opt3 = {
                uri: 'https://lyrics-api.mybluemix.net/whatsound/api/v1/vagalume/hotspots',
                Method: "GET"
            }
            

            function call3(error, response, body) {
                if (!error && response.statusCode == 200) {
                    var info = responseFix(body);
                    for (var i = 0; i < info['trend'].length; i++) {
                        trackList.push(info['trend'][i].name + " + " + info['trend'][i].artist);
                    }
                    
                    var uri = 'https://music-api.mybluemix.net/whatsound/api/v1/spotify/track/values?query=';
                    for (var i = 0; i < trackList.length; i++) {
                        urlList.push(uri + trackList[i]);
                    }
                    Promise.map(urlList, function (url) {
                        return request.getAsync(url).spread(function (resp, body1) {
                            return [body1, url];
                        });
                    }).then(function (results) {
                        res.send(responseFixArray(results));
                    }).catch(function (err) {
                        console.log(err);
                    })
                }
            }
            request(opt3, call3);
            break;
    }
});

function responseFix(data) {
    var str = JSON.stringify(data).split("\\n").join("<br>");
    str = str.replace(/\\/g, '');
    str = str.slice(1);
    str = str.slice(0, str.lastIndexOf('"'));
    console.log(str);
    return JSON.parse(str);
    

} 

function responseFixArray(data){
    var returnData = [];
    for(var dt in data){
        console.log(data[dt][0]); 
        if(data[dt][0] != "") returnData.push(responseFix(data[dt][0]));
    }
    return returnData;
}
//serve static file (index.html, images, css)
app.use(express.static(__dirname + '/views'));



var port = process.env.PORT || 4000
app.listen(port, function () {
    console.log("Server Running on http://localhost:" + port);
});
