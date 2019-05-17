//MaidBot
//Cleans a text channel with !cleanse

// Imports the discord.js module
const Discord = require('discord.js');
//Imports node-schedule module that handles timers and scheduling
const schedule = require('node-schedule');
//config.json file in the same root directory as maidbot.js file
const config = require('./config.json');


// Create an instance of a Discord client
const client = new Discord.Client();

/**
 * The ready event is vital, it means that only _after_ this will your bot start reacting to information
 * received from Discord
 */

client.once('ready', function(){
	console.log('I am ready!');
});

//schedules the bot to clean up channel specified in the config.json
//timer uses cronjob notation for scheduling
let timer = schedule.scheduleJob('0 9 * * *', function(){
	deleteMessages(client.channels.find('name', config.timedchannel));
});

//deletes messages on the channel received as an argument
function deleteMessages(channel){
	
	channel.fetchMessages({limit: 100})
	.then(function(messages){
		//creates an array of messages on the current channel
		let messagesArr = messages.array();
		//number of messages
		let messageCount = messagesArr.length;
		//deleting messages in the array
		for(let i = messageCount - 1; i > -1; i--) {
			messagesArr[i].delete();
		}
	})
	.then(function(){
		//cleanmsg string in a separate config.json file
		channel.send(config.cleanmsg);
	})
	.catch(function(err){
		console.log('error thrown');
		console.log(err);
	});
};


client.on('message', function(userMsg){
  
	let channelArr = client.channels.array();
	//cleans a channel's messages when user writes !cleanse and the channel name
	if(userMsg.content.startsWith('!cleanse')){
		//if user message only contains !cleanse, the current channel is cleansed
		if(userMsg.content === '!cleanse'){
			deleteMessages(userMsg.channel);
		}
		else{
			//searches for a channel with the name that is inside !cleanse message
			for(let i = 0; i < channelArr.length; i++){
				if(userMsg.content.indexOf(channelArr[i].name) > -1){
					deleteMessages(channelArr[i])
				}
			}
		}
	}
	else if(userMsg.content === '!botinfo'){
		//gives info about what the bot does, when user sends '!botinfo'
		userMsg.channel.send('"!cleanse": cleans the current channel of up to 100 messages\n' + 
							'"!cleanse channel-name": cleans channel-name of up to 100 messages');
	}
	
});


// login to Discord with your app's token
// replace config.token with your own auth token, or put your token in a config.json file
client.login(config.token);