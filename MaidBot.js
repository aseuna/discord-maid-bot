// MaidBot
// Cleans a text channel with !clean

// Imports the discord.js module
const Discord = require('discord.js');
// Imports node-schedule module that handles timers and scheduling
// node-schedule module by Matt Patenaude
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

// these variables will be changeable later through user commands inside discord client
let cleanmsg = 'Channel cleaned :sunglasses:';
let timedchannel = undefined;

// default values for cronjob scheduling -- 0 9 * * * => the task is scheduled every day at 9 am
// changeable with user commands to a desired schedule
let cronhour = undefined;
let cronmin = undefined;
let cronsec = undefined;
// function returns the schedule in cronjob format used with the schedule timer
function cronschedule(cronsec, cronmin, cronhour){
	return cronsec + ' ' + cronmin + ' ' + cronhour + ' * * *'
}

// timer uses cronjob notation for scheduleJob, for example '30 18 * * *'
let timer = null;

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
// deletes messages up to 100 that are newer than 2 weeks -> bulkDelete feature
function bulkDeleteMessages(channel){
	
	/** 
	* implement permission check for deleting messages later
	* if no permission, return a message saying no permission to clean the channel
	*/
	// deletes the messages on the channel if found
	if(channel != null){
		channel.bulkDelete(100);
		
		// only sends the cleaning message if it's not null
		if(cleanmsg !== null){
			channel.send(cleanmsg);
		}
	}
};


client.on('message', function(userMsg){
	
	// all user input option are below, the user message contains a command starting with !
	
	if(userMsg.content.startsWith('!clean')){
		// if user message only contains !clean, the current channel is cleansed
		if(userMsg.content === '!clean'){
			bulkDeleteMessages(userMsg.channel);
		}
		else{
			// cleans a channel's messages when user writes !clean and the channel name
			// sets channels in an array
			let channelArr = client.channels.array();
			// searches for a channel with the name that is inside !clean message
			for(let i = 0; i < channelArr.length; i++){
				if(userMsg.content.indexOf(channelArr[i].name) > -1){
					// cleans the messages in the user specified channel if found
					bulkDeleteMessages(channelArr[i]);
				}
			}
		}
	}
	else if(userMsg.content === '!botinfo'){
		// gives info about what the bot does, when user sends '!botinfo'
		userMsg.channel.send('"!clean": cleans the current channel of up to 100 messages\n\n' + 
					'"!clean channel-name": cleans channel-name of up to 100 messages\n\n' + 
					'"!settime hrs.mins.secs": sets time for daily cleanup for a specified channel, use "." as a separator or the time is invalid, notation follows 24-hour clock, mins and secs optional\n\n' + 
					'"!setchannel channel-name": sets the channel for daily cleanup\n\n' + 
					'"!setcleanmsg message": sets message that the bot posts after cleaning a channel\n\n' + 
					'"!delcleanmsg": deletes the message the bot posts after cleaning a channel, no message will be posted\n\n' +
					'Currently has scheduled cleanup on channel "' + timedchannel + '"' + ' at ' + cronhour + '.' + cronmin + '.' + cronsec + '\n\n' +
					'Bot doesn\'t currently use datadase for storing information so clean up channel and time has to be set every time bot goes offline and online again\n\n' + 
					'Remember to give the bot the required permissions to delete/manage messages on the channels you want them deleted'
 					);
	}
	else if(userMsg.content.startsWith('!settime')){

		// seprates the !settime command from the time user gives
		let time = userMsg.content.substring(9);
		// splits the time string into an array whose cells represent hours, minutes and seconds respectively
		let timeArr = time.split('.');
		console.log(timeArr);
		// the user input is only valid if hours are a number between 0-23 (a 24-hour clock), the mins and secs must be between 0-59, but they can also be undefined
		// the timeArr[0] string length must be less than 3 or the input is invalid
		if((parseInt(timeArr[0]) >= 0 && parseInt(timeArr[0]) < 24) && (parseInt(timeArr[1]) >= 0 && parseInt(timeArr[1]) < 60 || timeArr[1] === undefined) && (parseInt(timeArr[2]) >= 0 && parseInt(timeArr[2]) < 60 || timeArr[2] === undefined) && timeArr[0].length < 3){
			
			// sets cronhour to the hour of user input
			cronhour = parseInt(timeArr[0]);
			// if mins and secs input is invalid they are set as zeros
			if(timeArr[1] === undefined){
				cronmin = 0;
			}
			else{
				// sets cronmin to the mins of user input
				cronmin = parseInt(timeArr[1]);
			}
			
			if(timeArr[2] === undefined){
				cronsec = 0;
			}
			else{
				// sets cronsec to the secs of user input
				cronsec = parseInt(timeArr[2]);
			}
			
			// cancels the earlier schedulejob if it exists
			if(timer !== null){
				timer.cancel();
			}
			// timer uses cronjob notation for scheduleJob, for example '30 18 * * *'
			timer = schedule.scheduleJob(cronschedule(cronsec, cronmin, cronhour), function(){
				bulkDeleteMessages(client.channels.find(ch => ch.name === timedchannel));
			});
			
			userMsg.channel.send('Clean time is now set :sunglasses:');
		}
		else{
			// informs user in input was invalid
			userMsg.channel.send('Invalid time input');
		}
		
	}
	else if(userMsg.content.startsWith('!setchannel')){
		
		let channelFound = false;	// tells if a channel has found that corresponds to user input
		let channelArr = client.channels.array();
		// searches for a channel with the name that is inside !setchannel message
		for(let i = 0; i < channelArr.length; i++){
			if(userMsg.content.indexOf(channelArr[i].name) > -1){
				// sets timedchannel, which is the channel to be cleaned,
				timedchannel = channelArr[i].name;
				channelFound = true;
			}
		}
		
		if(!channelFound){
			userMsg.channel.send('Invalid channel input');
		}
	}
	else if(userMsg.content.startsWith('!setcleanmsg')){
		// sets message for bot that is posted after channel clean up
		cleanmsg = userMsg.content.substring(14);
	}
	else if(userMsg.content.startsWith('!delcleanmsg')){
		// sets clean up message to null
		// no message is posted
		cleanmsg = null;
	}
	
	// user input options end here
	
});



// login to Discord with your app's token
// replace process.env.TOKEN with your own auth token, or put your token in a .env file
// DO NOT PUBLICLY RELEASE YOUR AUTH TOKEN
client.login(process.env.TOKEN);