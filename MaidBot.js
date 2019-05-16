//MaidBot
//Cleans a text channel with !cleanse

// Import the discord.js module
const Discord = require('discord.js');
const config = require('./config.json');


// Create an instance of a Discord client
const client = new Discord.Client();

/**
 * The ready event is vital, it means that only _after_ this will your bot start reacting to information
 * received from Discord
 */

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
		channel.send('Channel cleansed :)');
	})
	.catch(function(err){
		console.log('error thrown');
		console.log(err);
	});
};


client.once('ready', function(){
	console.log('I am ready!');
});

client.on('message', function(userMsg){
  
	//cleans the current channel's messages when user writes !cleanse on that particular channel
	if(userMsg.content === '!cleanse') {
		deleteMessages(userMsg.channel);
	}
	
});


// login to Discord with your app's token
// replace config.token with your own, or put your token in a config.json file
client.login(config.token);