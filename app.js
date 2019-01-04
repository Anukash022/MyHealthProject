'use strict';

var express = require('express'); // app server
var AssistantV1  = require('watson-developer-cloud/assistant/v1'); // watson sdk
var http = require('http');
var request= require('request');
var app = express();
var custom = require('./custom.js');
var fs = require('fs');

/*var cus= require('custom.js');*/
//var custom = require('custom.js');

var Action1 = 'CallDiscovery';


// Bootstrap application settings
app.use(express.static('./public')); // load UI from public folder
app.use(bodyParser.json());

// setupError will be set to an error message if we cannot recover from service setup or init error.
let setupError = '';


var assistant  = new AssistantV1({
  username: 'a9511339-71fa-4d18-92e6-90d4ce9f240c', // replace with username from service key
  password: '80R2GMUW8Ovu', // replace with password from service key
  version: '2018-02-16' 
});

var DiscoveryV1 = require('watson-developer-cloud/discovery/v1');

var discovery = new DiscoveryV1({
    version_date: '2017-10-16',
    username: '0160cebd-b178-43c3-abab-114ef5bf85b7',
    password: 'tgCu8gZAQAxE',
	 url: 'https://gateway.watsonplatform.net/discovery/api/'
});

app.post('/api/message', function(req, res) {
	var workspace = '860e4ff9-8f5e-444d-bc43-368f4cfafa05';
	 if (setupError) {
		    return res.json({ output: { text: 'The app failed to initialize properly. Setup and restart needed.' + setupError } });
		  }
	 
	 if (!workspace) {
		    return res.json({
		      output: {
		        text: 'Conversation initialization in progress. Please try again.'
		      }
		    });
		  }

  var payload = {
    workspace_id: workspace,
    context: req.body.context || {},
    input: req.body.input || {}
  };
  
	//common regex patterns
	 /* const regpan = /^([a-zA-Z]){5}([0-9]){4}([a-zA-Z]){1}?$/;
	 
	  if (req.body) 
	  {
		 
	    if (req.body.input) 
	    {
	      let inputstring = req.body.input.text;
	      console.log('input string ', inputstring);
	      const words = inputstring.split(' ');
	      console.log('words ', words);
	      inputstring = '';
	      for (let i = 0; i < words.length; i++) 
	      {
	    	  if (regpan.test(words[i]) === true) 
	    	  {
	    		  // const value = words[i];
	    		  words[i] = '1111111111';
	    	  }
	    	  inputstring += words[i] + ' ';
	      }
	      // words.join(' ');
	      inputstring = inputstring.trim();
	      console.log('After inputstring '+JSON.stringify(req.body));
	     
	      
	    }
		if (req.body.context)
		{
			 console.log('After inputstring 2222  '+JSON.stringify(req.body.context));
		  // The client must maintain context/state
		      payload.context = req.body.context;
		}
	 }*/
  /*Calltone(payload);*/
	  callconversation(payload);
	
	  
	function callconversation(payload) 
	{
		 //console.log(payload.input);
	    const queryInput = JSON.stringify(payload.input);
	    
	    assistant.message(payload, function(err, data) {
	        if (err) 
	        {
	        	console.log("inside if --** ");
				return res.status(err.code || 500).json(err); c
	        } 
	        else if(data.context.Action === Action1)
        	{
	        	callDiscoveryFunc(payload,data);
        	}
	        
	        else
	        {
	        	console.log("Outside ELSE IF"+JSON.stringify(data));
	        	
	        	return res.json(updateMessage(payload,data));
	        }
	      });
	    
	}
	
	 function callDiscoveryFunc(payload,data) {
		 var docText="";
		 console.log('Test 1');
		discovery.query({
			 environment_id: '6ab30fed-9116-4e7b-b273-62a86024af0f',
		//	 collection_id: 'f259c662-e49b-48da-bd1b-749f7fab2436',
			 collection_id: '0d7932e5-42be-411a-ac8c-b3f851474a77',
			 natural_language_query: data.context.Query,
			 passages: true,
			 "passages.count":20,
			 addReturnField:"result_metadata"
		 }, function(err, response) {
			 console.log('TEST 2');
			 if (err) {
				 console.error(err);
			 } else {
				 console.log(JSON.stringify(response, null, 2));
				 data.context.count=0;
				 var responsePassage="";
				// var responsePassage2=response.results[0].html.substring(0, 400);
				//console.log("Result>>>>>>>>>>>>>>>>>>>>>>>>>"+response.results[0].result_metadata);
				// var title=response.results[0].extracted_metadata.title;//Title of Document
				 
				 if(response.results.length>0)
					 {
				 docText=JSON.stringify(response.results[0].html, null, 2);
				 var docID=response.results[0].id; //Get the Doc Id of most relevant document
				 console.log("DocID"+docID);
				
				var temp=0;
					 for(var i=0;i<response.passages.length;i++)
						{
						if(docID===response.passages[i].document_id)
						{
							responsePassage=response.passages[i].passage_text;
							 temp=1;
							break;
						}
						}
						 
					 
					 if(temp===0)
						 {
						 responsePassage=response.results[0].text.substring(0,250);
						 }
					 
					 console.log("responsepassage"+JSON.stringify(responsePassage));
					 console.log("responseDoc"+JSON.stringify(docText));
					 //console.log("responsepassage"+responsePassage);
					 console.log("Output>>>>>>"+JSON.stringify(data.output.text));
					 if(data.output.text.length===0)
						 {
						 data.output.text="<div>"+responsePassage+"</div>"+ "<br>"+ "<a onClick='a("+docText+");' id='popupid' style='cursor: pointer; cursor: hand; color: blue'>Click here to view full Document</a>";
						 }
					 else
						 {
				 data.output.text=data.output.text+"<br>"+"<div class='passage'>"+responsePassage+ "<br>"+ "<a onClick='a("+docText+");' id='popupid' style='cursor: pointer; cursor: hand; color: blue'>Click here to view full Document</a>"+"</div>";
						 }
					 data.context.count=1;
					 }
				
				 return res.json(data);
			 }
		 }); 

		console.log('TEST 3');
	 }	
	 
	
});

function updateMessage(input, response) {
	  var responseText = null;
	  if (!response.output) {
	    response.output = {};
	  } else {
	    return response;
	  }
	  if (response.intents && response.intents[0]) {
	  console.log("response.intents[0]");
	    var intent = response.intents[0];
	    	    if (intent.confidence >= 0.75) {
	      responseText = 'I understood your intent was ' + intent.intent;
	    } else if (intent.confidence >= 0.5) {
	      responseText = 'I think your intent was ' + intent.intent;
	    } else {
	      responseText = 'I did not understand your intent';
	    }
	  }
	  response.output.text = responseText;
	  return response;
	}
function handleSetupError(reason) {
  setupError += ' ' + reason;
  console.error('The app failed to initialize properly. Setup and restart needed.' + setupError);
  // We could allow our chatbot to run. It would just report the above error.
  // Or we can add the following 2 lines to abort on a setup error allowing Bluemix to restart it.
  console.error('\nAborting due to setup error!');
  process.exit(1);
}

module.exports = app;

