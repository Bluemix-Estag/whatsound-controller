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
            console.log("entrou no spotify");
            var opt = {
                uri: 'https://refinedsearch-api.mybluemix.net/whatsound/api/v1/refine/values?search=' + query,
                Method: "GET"
            }
            console.log(opt.uri)

            function call(error, response, body) {
                if (!error && response.statusCode == 200) {

                    var info = JSON.parse(body);
                    bodyGoogle.type = info.type
                    bodyGoogle.query = info.query;
                    var options = {
                        uri: 'https://music-api.mybluemix.net/whatsound/api/v1/spotify/' + bodyGoogle.type + '/values?query=' + bodyGoogle.query,
                        Method: "GET"
                    }

                    console.log(options.uri);

                    function callbackS(error, response, spotBody) {
                        console.log('spotBody: ' + JSON.stringify(spotBody));
                        if (!error && response.statusCode == 200) {
                            console.log("resposta: ");
                            console.log(JSON.stringify(JSON.parse(spotBody)));
                            spotBody = JSON.parse(spotBody);
                            spotBody.typeGoogle = bodyGoogle.type;
                            res.setHeader('content-type', 'application/json');
                            res.status(200).json(spotBody);
                        } else {
                            console.log('spotify error : ' + JSON.stringify(spotBody));
                            res.status(404).json({
                                "status": false,
                                "message": "Track not found"
                            });
                        }
                    }
                    request(options, callbackS);
                } else {
                    console.log('Google error: ' + JSON.stringify(body));
                    res.status(404).json({
                        status: false,
                        message: "Google Error : Not found"
                    });
                }
            }

            request(opt, call);
            break;
            
        case 'deezer':
            console.log("entrou no deezer");
            var optD = {
                uri: 'https://refinedsearch-api.mybluemix.net/whatsound/api/v1/refine/values?search=' + query,
                Method: "GET"
            }
            console.log(optD.uri)

            function call1(error, response, body) {
                if (!error && response.statusCode == 200) {

                    var info = JSON.parse(body);
                    bodyGoogle.type = info.type
                    bodyGoogle.query = info.query;
                    var optionsD = {
                        uri: 'https://musicdeezer-api.mybluemix.net/whatsound/api/v1/deezer/track/values?query=' + bodyGoogle.query,
                        Method: "GET"
                    }

                    console.log(optionsD.uri);

                    function callback(error, response, deezerBody) {
                        console.log('deezerBody: ' + JSON.stringify(deezerBody));
                        if (!error && response.statusCode == 200) {
                            console.log("resposta: ");
                            console.log(JSON.stringify(JSON.parse(deezerBody)));
                            deezerBody = JSON.parse(deezerBody);
                            deezerBody[0].typeGoogle = bodyGoogle.type
                            res.setHeader('content-type', 'application/json');
                            // res.status(200).json({deezerBody,"typeGoogle": bodyGoogle.type});
                            res.status(200).json(deezerBody);
                        } else {
                            console.log('spotify error : ' + JSON.stringify(deezerBody));
                            res.status(404).json({
                                "status": false,
                                "message": "Track not found"
                            });
                        }
                    }
                    request(optionsD, callback);
                } else {
                    console.log('Google error: ' + JSON.stringify(body));
                    res.status(404).json({
                        status: false,
                        message: "Google Error : Not found"
                    });
                }
            }

            request(optD, call1);
            break;
        case 'youtube':
            console.log("porta do youtube");
            var opt1 = {
                uri: 'https://refinedsearch-api.mybluemix.net/whatsound/api/v1/refine/values?search=' + query,
                Method: "GET"
            }

            function call2(error, response, body) {
                if (!error && response.statusCode == 200) {
                    console.log("entrou");
                    var info = responseFix(body);
                    bodyGoogle.type = info.type;
                    bodyGoogle.query = info.query;
                    if (bodyGoogle.type == "artist" || bodyGoogle.type == "track" || bodyGoogle.type == "album") {
                        bodyGoogle.query = info.query;
                        var options1 = {
                            uri: 'https://video-api.mybluemix.net/whatsound/api/v1/youtube/clip/values?query=' + removeDiacritics(bodyGoogle.query),
                            Method: "GET"
                        }
                        request(options1, callback1);
                    }

                } else {
                    console.log('Google error: ' + JSON.stringify(body));
                    var result = {
                        code: 404,
                        status: false,
                        message: "Not Found"
                    }
                    res.setHeader('content-type', 'application/json');
                    res.status(404).send(result);
                    //                    
                }
            }

            function callback1(error, response, youtubeBody) {
                if (!error && response.statusCode == 200) {
                    //                    youtubeBody = responseFix(youtubeBody);
                    youtubeBody = JSON.parse(youtubeBody);
                    res.send(youtubeBody);
                } else {
                    var result = {
                        code: 404,
                        status: false,
                        message: "Not Found"
                    }
                    res.setHeader('content-type', 'application/json');
                    res.status(404).send(result);
                }
            }
            request(opt1, call2);
            break;
        case 'lyrics':
            var opt2 = {
                uri: 'https://refinedsearch-api.mybluemix.net/whatsound/api/v1/refine/values?search=' + query,
                Method: "GET"
            }
            console.log(query);

            function call3(error, response, body) {
                if (!error && response.statusCode == 200) {
                    console.log('Google: ', JSON.stringify(JSON.parse(body)));
                    //                    var info = responseFix(body);
                    var info = JSON.parse(body);
                    console.log('info: ', JSON.stringify(info));
                    if (bodyGoogle.type != "artist" || bodyGoogle.type != "track" || bodyGoogle.type != "album") {
                        bodyGoogle.query = info.query;
                        var googleQuerySplit = JSON.stringify(bodyGoogle.query).split('+');
                        bodyGoogle.track = (googleQuerySplit.length > 1) ? googleQuerySplit[0] : '';
                        bodyGoogle.artist = (googleQuerySplit.length > 1) ? googleQuerySplit[1] : googleQuerySplit[0];
                        var options2 = {
                            uri: 'https://lyrics-api.mybluemix.net/whatsound/api/v1/vagalume/lyrics/values?track=' + removeDiacritics(bodyGoogle.track) + '&artist=' + removeDiacritics(bodyGoogle.artist),
                            Method: "GET"
                        }
                        console.log(options2.uri);
                        request(options2, callback2);
                    }

                } else {
                    console.log('Google error: ' + JSON.stringify(body));
                    var result = {
                        code: 404,
                        status: false,
                        message: "Not Found"
                    }
                    res.setHeader('content-type', 'application/json');
                    res.status(404).send(result);
                }
            }

            function callback2(error, response, lyricsBody) {
                if (!error && response.statusCode == 200) {
                    console.log('test');
                    lyricsBody = (JSON.parse(lyricsBody));
                    res.status(response.statusCode).json(lyricsBody);
                } else {
                    console.log('Lyrics error : ' + JSON.stringify(lyricsBody));
                    var result = {
                        code: 404,
                        status: false,
                        message: "Not Found"
                    }
                    res.setHeader('content-type', 'application/json');
                    res.status(404).send(result);
                }
            }
            request(opt2, call3);
            break;
        case 'toptracks':
            var trackList = [];
            var urlList = [];
            var opt3 = {
                uri: 'https://lyrics-api.mybluemix.net/whatsound/api/v1/vagalume/hotspots',
                Method: "GET"
            }


            function call4(error, response, body) {
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
                        res.send(err);
                    })
                } else {
                    var result = {
                        code: 404,
                        status: false,
                        message: "Not Found"
                    }
                    res.setHeader('content-type', 'application/json');
                    res.status(404).send(result);
                }
            }
            request(opt3, call4);
            break;
    }
});

function responseFix(data) {
    var str = JSON.stringify(data).split("\\n").join("<br>");
    str = str.replace(/\\/g, '');
    str = str.slice(1);
    str = str.slice(0, str.lastIndexOf('"'));
    return JSON.parse(str);
}


function responseLyricsFix(data) {
    return JSON.parse(JSON.stringify(data).split("\\n").join("<br>"));
}
function removeDiacritics(str) { 
    return encodeURI(str).replace(/%20/g, "+"); 
    }
function responseFixArray(data) {
    var returnData = [];
    for (var dt in data) {
        console.log(data[dt][0]);
        if (data[dt][0] != "") returnData.push(responseFix(data[dt][0]));
    }
    return returnData;
}
//serve static file (index.html, images, css)
app.use(express.static(__dirname + '/views'));


var port = process.env.PORT || 4000
app.listen(port, function () {
    console.log("Server Running on http://localhost:" + port);
});
