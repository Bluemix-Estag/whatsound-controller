/**
 * This file contains all of the web and hybrid functions for interacting with
 * Watson Conversation service. When API calls are not needed, the
 * functions also do basic messaging between the client and the server.
 *
 * @summary   Functions for whatsound bot.
 *
 * @link      whatsound-conversation.mybluemix.net
 * @since     0.0.3
 * @requires  server.js
 *
 */


var watson = require('watson-developer-cloud');
var CONVERSATION_NAME = "WhatSound-Conversation"; // Conversation name goes here.
//var 
var cfenv = require('cfenv');

var fs = require('fs');

var vcapLocal = null;
var appEnv = null;
var appEnvOpts = {};
var conversationWorkspace, conversation;

fs.stat('./vcap-local.json', function (err, stat) {
    if (err && err.code === 'ENOENT') {
        // File does not exist;
        console.log('No vcap-local.jsom');
        initializedAppEnv();
    } else if(err) {
        console.log('Error retrieving local vcap: ', err.code);
    } else {
        vcapLocal = require('../vcap-local.json');
        console.log('Loaded local VCAP', vcapLocal);
        appEnvOpts = {
            vcap: vcapLocal
        };
        initializedAppEnv();
    }
});

// Get the environment from CLoud Foundry, defaulting to local VCAP
function initializedAppEnv() {
    appEnv = cfenv.getAppEnv(appEnvOpts);
    if (appEnv.isLocal) {
        require('dotenv').load();
    }
    if (appEnv.services.conversation) {
        initConversation();
    } else {
        console.error('No Watson conversation service exists');
    }
}





// ===============================
// CREATE THE SERVICE WRAPPER
// ===============================


function initConversation() {
    var conversationCredentials = appEnv.getServiceCreds(CONVERSATION_NAME);
    console.log(conversationCredentials);
    var conversationUsername = process.env.CONVERSATION_USERNAME || conversationCredentials.username;
    var conversationPassword = process.env.CONVERSATION_PASSWORD || conversationCredentials.password;
    var conversationURL = process.env.CONVERSATION_URL || conversationCredentials.url;
    conversation = watson.conversation({
        url: conversationURL,
        username: conversationUsername,
        password: conversationPassword,
        version_date: '2017-04-10',
        version: 'v1'
    });
    // check if the workspace ID is specified in the environment
    conversationWorkspace = process.env.CONVERSATION_WORKSPACE;
    // if not, look it up by name or create one
    if (!conversationWorkspace) {
        const workspaceName = "WhatSound-Conversation-btc";//CONVERSATION_NAME;
        console.log('No conversation workspace configured in the environment.');
        console.log(`Looking for a workspace named '${workspaceName}'...`);
        conversation.listWorkspaces((err, result) => {
            if (err) {
                console.log('Failed to query workspaces. Conversation will not work.', err);
            } else {
                const workspace = result.workspaces.find(workspace => workspace.name === workspaceName);
                if (workspace) {
                    conversationWorkspace = workspace.workspace_id;
                    console.log("Using Watson Conversation with username", conversationUsername, "and workspace", conversationWorkspace);
                } else {
                    console.log('Importing workspace from ./conversation/whatsound-conversation.json');
                    // create the workspace
                    const watsonWorkspace = JSON.parse(fs.readFileSync('./conversation/whatsound-conversation.json'));
                    // force the name to our expected name
                    watsonWorkspace.name = workspaceName;
                    conversation.createWorkspace(watsonWorkspace, (createErr, workspace) => {
                        if (createErr) {
                            console.log('Failed to create workspace', err);
                        } else {
                            conversationWorkspace = workspace.workspace_id;
                            console.log(`Successfully created the workspace '${workspaceName}'`);
                            console.log("Using Watson Conversation with username", conversationUsername, "and workspace", conversationWorkspace);
                        }
                    });
                }
            }
        });
    } else {
        console.log('Workspace ID was specified as an environment variable.');
        console.log("Using Watson Conversation with username", conversationUsername, "and workspace", conversationWorkspace);
    }
}


// Allow clients to interact
var chatbot = {
    sendMessage: function (req,callback){
        buildContextObject(req,function(err,params){
            if(err){
                console.log("Error in building the parameters object: ",err);
                return callback(err);
            }
            if(params.message){

                var context = req.body.context;
                var res = {
                    intents: [],
                    entities: [],
                    input: req.body.text,
                    output:{
                        text: params.message
                    },
                    context: context
                }
                callback(null,res);
            }else if(params){
                conversation.message(params,function(err,data){
                    if(err){
                        console.log("Error in sending message: ",err);
                        return callback(err);
                    }else{
                        var conv = data.context.conversation_id;
                        console.log("Got response from WhatSound: ",JSON.stringify(data));
                        return callback(null,data);
                    }
                })
            }
        })
    }
}



// ============================================
// UTILITY FUNCTION FOR CHATBOR
// ============================================

function buildContextObject(req, callback){
    var message = req.body.text;
    var context;
    if(!message){
        message = '';
    }
    
    // Null out the parameter object to start building
    var params = {
        workspace_id : conversationWorkspace,
        input: {},
        context: {}
    };
    
    if(req.body.context){
        context= req.body.context;
        params.context = context;
    }else{
        context= '';
    }
    
    // Set parameter for playload to Watson Conversation
    params.input = {
        text: message
    }
    
    return callback(null,params);
}

module.exports = chatbot;






















