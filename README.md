# WhatSound Orchestrator and Conversation microservice



Endpoint to get a JSON object of watson converation response and other microservices 

like spotify music search for artist, album, music. Also youtube microservice to get

the music's clip and vagalume microservice to get the music's lyrics



REST API example:

```
    POST https://whatsound-orchestrator.mybluemix.net/WhatSound"
```

Sending a JSON Object having context object and text, to continue Watson Conversation's chat




# Response:

```
 {
    output : {
        text : [{"Hey there! How can i help you?"}]
    }
    context : { <CONVERSATION_CONTEXT_KEYS_VALUES> } 
    ...
 }

```

@return An object of all the conversation params

# POST example:

using *request*

```
    var request = require('request');
    var options = {
        uri : "https://whatsound-orchestrator.mybluemix.net/WhatSound",
        method: "POST",
        header : {
            content-type : "application/json"
        },
        json : { text : "Ola WhatSound" , context : { <CONVERSATION_CONTEXT_KEYS_VALUES>}}
    }
    
    function callback(error,response,body){
        if(!error && response.statusCode == 200 ){
            // Manipulate the response body
            
        }else{
            // ERROR handle!
        }
    }
    request(options,callback);
    

```



