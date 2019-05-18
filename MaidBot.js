// MaidBot
// Cleans a text channel with !clean

// Imports the discord.js module
const Discord = require('discord.js');
// Imports node-schedule module that handles timers and scheduling
const schedule = require('node-schedule');
// imports dotenv module to support environment variables
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

// Create an instance of a Discord client
const client = new Discord.Client();

/**
 * The ready event is vital, it means that only _after_ this will your bot start reacting to information
 * received from Discord
 */

client.once('ready', function(){
	console.log('I am ready!');
});

//let botMember = client.guild.me;

// these variables will be changeable later through user commands inside discord client
let cleanmsg = 'Channel cleaned :sunglasses:';
let timedchannel = 'bot-cleanup-channel';

// default values for cronjob scheduling -- 0 9 * * * => the task is scheduled every day at 9 am
// later changeable with user commands to a desired schedule
let cronhour = 9;
let cronmin = 0;
// function for returning the schedule in cronjob format used with the schedule timer
function cronschedule(cronmin, cronhour){
	return cronmin + ' ' + cronhour + ' * * *'
}

/**
* Currently defunkt feature of mass deleting messages by fetching them individually
* Using bulkDelete messages is safer regarding API abuse and possibly getting your account removed
function deleteMessagesInd(channel){
	// implement permission check for deleting messages later
	// if no permission, return a message saying no permission to clean the channel
	channel.fetchMessages({limit: 100})
	.then(function(messages){
		//creates an array of messages on the current channel
		let messagesArr = messages.array();
		// number of messages
		let messageCount = messagesArr.length;
		// deleting messages in the array
		for(let i = messageCount - 1; i > -1; i--) {
			messagesArr[i].delete();
		}
	})
	.then(channel.send(cleanmsg))
	.catch(function(err){
		console.log('error thrown');
		console.log(err);
	});
}*/

// bulk deletes messages on the channel received as an argument
// deletes only messages up to 100 and messages newer than 2 weeks
function bulkDeleteMessages(channel){
	
	// implement permission check for deleting messages later
	// if no permission, return a message saying no permission to clean the channel
	
	channel.bulkDelete(100);
	channel.send(cleanmsg);

};


client.on('message', function(userMsg){
	
	// cleans a channel's messages when user writes !cleanse and the channel name
	if(userMsg.content.startsWith('!clean')){
		// if user message only contains !cleanse, the current channel is cleansed
		if(userMsg.content === '!clean'){
			bulkDeleteMessages(userMsg.channel);
		}
		else{
			// sets channels in an array
			let channelArr = client.channels.array();
			// searches for a channel with the name that is inside !clean message
			for(let i = 0; i < channelArr.length; i++){
				if(userMsg.content.indexOf(channelArr[i].name) > -1){
					bulkDeleteMessages(channelArr[i]);
				}
			}
		}
	}
	else if(userMsg.content === '!botinfo'){
		// gives info about what the bot does, when user sends '!botinfo'
		userMsg.channel.send('"!clean": cleans the current channel of up to 100 messages\n\n' + 
					'"!clean channel-name": cleans channel-name of up to 100 messages\n\n' + 
					'Currently has scheduled cleanup on channel "' + timedchannel + '"'
					);
	}
	else if(userMsg.content.startsWith('!perm')){
		if(botMember.guild.me.hasPermission('MANAGE_MESSAGES')){
			console.log('I have permission');
		}
		else{
			console.log('I don\'t have permission');
		}
	}
	
});

// timer uses cronjob notation for scheduleJob, for example '30 18 * * *'
let timer = schedule.scheduleJob(cronschedule(cronmin, cronhour), function(){
	deleteMessages(client.channels.find('name', timedchannel));
});

// login to Discord with your app's token
// replace process.env.TOKEN with your own auth token, or put your token in a .env file
// DO NOT PUBLICLY RELEASE YOUR AUTH TOKEN
client.login(process.env.TOKEN);