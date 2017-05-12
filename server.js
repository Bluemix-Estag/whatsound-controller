var express = require("express");
var app = express();
var chatbot = require('./config/bot.js');

var bodyParser = require('body-parser');
var request = require('request');


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






function conversation(req, res) {
    var params = req.body || null;

    if (Object.keys(params).length != 0) {
        processChatMessage(req, res);
    } else {
        res.status(400).json({
            error: "true"
        });
    }

}


function processChatMessage(req, res) {
    chatbot.sendMessage(req, function (err, data) {
        if (err) {
            console.log('Error in sending message: ', err);
            res.status(err.code || 500).json(err);
        } else {

            treatConversationContext(data, res);
            //            res.status(200).json(data);
        }
    })
}


/**
 * Endpoint to get a JSON object of WhatSound MicroServices 
 * REST API example:
 * <code>
 * POST https://whatsound.mybluemix.net/
 * </code>
 *
 * Response:
 * [ "Bob", "Jane" ]
 * @return An array of all the visitor names
 
 * error case : 100 ( Dados invalidos )
 */
app.post("/WhatSound", function (req, res) {
    console.log('Whatsound orchestrator invoked..');

    var data = req.body;
    var params = data;

    if (params === null) {
        res.status(400).json({
            "code": 400,
            "message": "Bad Request ( Invalid parms )"
        })
    } else {

        console.log('Orchestrator whatsound route invoked');
        params = (Object.keys(params).length == 0) ? {
            text: ""
        } : params;
        req.body = params;
        conversation(req, res);
    }



});


function treatConversationContext(body, res) {
    console.log('Conversation response in method: ' + JSON.stringify(body));

    if (body['context']['search'] && !body['context']['exitTrackLoop'] && !body['context']['trackMedia']) {
        var options = {
            uri: 'https://refinedsearch-api.mybluemix.net/whatsound/api/v1/refine/values?search=' + body['context']['search'],
            method: "GET"
        }

        function callback(error, response, bodyGoogle) {

            var bodyGoogle = responseFix(bodyGoogle)


            if (!error && response.statusCode == 200 && bodyGoogle.status) {
                switch (bodyGoogle.type) {
                    case "track":
                        body.context.track = true;
                        console.log('Track type invoked');
                        spotMedia(body, bodyGoogle, res);

                        break;
                    case "artist":
                        console.log("artist type");
                        body.context.artist = true;
                        spotMedia(body, bodyGoogle, res);
                        break;
                    case "album":
                        console.log("album type ");
                        spotMedia(body, bodyGoogle, res);
                        break;
                }
            } else {
                // Return error message to front end..


                console.log('error api google');
                res.status(response.statusCode).json({
                    status: bodyGoogle.status,
                    message: bodyGoogle.message
                });
            }

        }

        request(options, callback);
    } else if (body['context']['trackMedia'] && !body['context']['clipeID']) {
        console.log('treat utube');
        youtTubeClip(body, res);

    } else if (body['context']['letra'] && !body['context']['letraTrigger']) {
        console.log('treat letra');


    } else {
        console.log('passou pelo else')
        res.status(200).json(body);
    }




}

function spotMedia(body, bodyGoogle, res) {

    var options = {
        uri: 'https://music-api.mybluemix.net/whatsound/api/v1/spotify/' + bodyGoogle.type + '/values?query=' + bodyGoogle.query,
        Method: "GET"
    }

    function callback(error, response, spotBody) {
        if (!error && response.statusCode == 200) {
            spotBody = responseFix(spotBody);
            if (bodyGoogle.type == "track") {
                body.context.trackName = spotBody.name;
                body.context.trackArtist = spotBody.artist;
                body.context.trackURI = spotBody.uri;
                body.context.trackURL = spotBody.url;
                body.context.trackAlbum = spotBody.album;
            } else if (bodyGoogle.type == "artist") {
                body.context.artistID = spotBody.id;
                body.context.artistName = spotBody.artist;
                body.context.artistURL = spotBody.url;
                body.context.artistTopTracks = spotBody.topTracks;
                body.context.artistRelated = spotBody.related;
                body.context.artistAlbums = spotBody.albums;
            }
            var req = {};
            req.body = body;
            conversation(req, res);

        } else {
            console.log('spotify error : ' + JSON.stringify(spotBody));
        }
    }

    request(options, callback);
}



function youtTubeClip(body, res) {

    var options = {
        uri: 'https://video-api.mybluemix.net/whatsound/api/v1/youtube/clip/values?query=' + body.context.trackName + '%20' + body.context.trackArtist,
        Method: "GET"
    }

    function callback(error, response, youtubeBody) {
        if (!error && response.statusCode == 200) {
            youtubeBody = responseFix(youtubeBody);
            body.context.clipeID = youtubeBody[0].id;
            var req = {};
            req.body = body;


            vagalumeLyrics(body, res);
            //            conversation(req, res);

        } else {
            console.log('youtube error : ' + JSON.stringify(spotBody));
            //Set youtube error on body
            vagalumeLyrics(body, res);
        }
    }

    request(options, callback);
}


function responseFix(data) {
    var str = JSON.stringify(data).split("\\n").join("<br>");
    str = str.replace(/\\/g, '');
    str = str.slice(1);
    str = str.slice(0, str.lastIndexOf('"'));
    return JSON.parse(str);
}



function vagalumeLyrics(body, res) {
    console.log('in method : ' + body['context']['trackName']);
    var options = {
        uri: "https://lyrics-api.mybluemix.net/whatsound/api/v1/vagalume/lyrics/values?track=" + body['context']['trackName'] + '&artist=' + body['context']['trackArtist'],
        method: "GET"

    }

    function callback(error, response, vagalumeBody) {
        if (!error && response.statusCode == 200) {
            vagalumeBody = responseFix(vagalumeBody);
            body.context.showLyrics = vagalumeBody.lyrics.track;
            console.log(JSON.stringify(body));
            //            res.status(200).json(body);
            var req = {};
            req.body = body;
            conversation(req, res);
        } else {
            console.log('Vagalume error: ' + JSON.stringify(vagalumeBody));
        }
    }
    request(options, callback);

}







//serve static file (index.html, images, css)
app.use(express.static(__dirname + '/views'));



var port = process.env.PORT || 4000
app.listen(port, function () {
    console.log("To view your app, open this link in your browser: http://localhost:" + port);
});
