var express = require("express");
var app = express();
var chatbot = require('./config/bot.js');

var bodyParser = require('body-parser');
var request = require('request');


// parse application/json
app.use(bodyParser.json())







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


        params = (Object.keys(params).length == 0) ? {
            text: ""
        } : params;
        req.body = params;
        conversation(req, res);
    }



});


function treatConversationContext(body, res) {
    console.log('Conversation response in method: ' + JSON.stringify(body));

    if (body['context']['search'] && !body['context']['exitTrack']) {
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
                        break;
                    case "album":
                        console.log("album type ");
                        break;
                }
            } else {
                // Return error message to front end..

                res.status(response.statusCode).json({
                    status: bodyGoogle.status,
                    message: bodyGoogle.message
                });
            }

        }

        request(options, callback);
    } else {

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
            body.context.trackName = spotBody.name;
            body.context.trackArtist = spotBody.artist;
            body.context.trackURI = spotBody.uri;
            body.context.trackURL = spotBody.url;
            var req = {};
            req.body = body;
            conversation(req,res);
            
        } else {
            console.log('spotify error : ' + JSON.stringify(spotBody));
        }
    }

    request(options, callback);
}


function responseFix(data) {
    var str = JSON.stringify(data).replace(/\\/g, '');
    str = str.slice(1);
    str = str.slice(0, str.lastIndexOf('"'));
    return JSON.parse(str);
}








//serve static file (index.html, images, css)
app.use(express.static(__dirname + '/views'));



var port = process.env.PORT || 4000
app.listen(port, function () {
    console.log("To view your app, open this link in your browser: http://localhost:" + port);
});
