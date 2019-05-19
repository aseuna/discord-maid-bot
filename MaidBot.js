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
// possibly required for hosting the bot on third party servers
// you can probably just igonore this
require('http').createServer().listen(3000);

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
let timedlimit = 100;

// default message deletion limit, used when user gives no limit parameter
const DEF_LIMIT = 100;

// default values for cronjob scheduling -- for example 0 0 9 * * * => the task is scheduled every day at 9 am
// changeable with user commands to a desired schedule
let cronhour = undefined;
let cronmin = undefined;
let cronsec = undefined;
// function returns the schedule in cronjob format used with the schedule timer, more about cronjob here: https://en.wikipedia.org/wiki/Cron
function cronschedule(cronsec, cronmin, cronhour){
	return cronsec + ' ' + cronmin + ' ' + cronhour + ' * * *'
}

// timer uses cronjob notation for scheduleJob, for example '30 18 * * *'
// timer is by default null, until user sets the time by !settime
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

// bulk deletes messages on the channel received as an argument, up to the limit
// deletes messages up to 100 that are newer than 2 weeks -> bulkDelete feature
function bulkDeleteMessages(channel, limit){
	
	/** 
	* implement permission check for deleting messages later
	* if no permission, return a message saying no permission to clean the channel
	*/
	// deletes the messages on the channel if found
	if(channel != null){
		channel.bulkDelete(limit);
		
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
		
		// sets channels in an array
		let channelArr = client.channels.array();
		// splits user message into an array so each part can be handled separately
		let userMsgArr = userMsg.content.split(' ');
		if(userMsg.content === '!clean'){
			// if there are no cleaning parameters, cleaning current channel with default limit
			bulkDeleteMessages(userMsg.channel, DEF_LIMIT);
		}
		else if(userMsgArr.length === 2){
			// checks if the second part of the userMsg is a number or not
			if(isNaN(parseInt(userMsgArr[1]))){
				// if the second element is not a number, should be channel name
				// searches for a channel with the name that is inside !clean message
				let channelFound = false;	// tells if a channel has found that corresponds to user input
				for(let i = 0; i < channelArr.length; i++){
					if(userMsg.content.indexOf(channelArr[i].name) > -1){
						// cleans the messages in the user specified channel if found
						bulkDeleteMessages(channelArr[i], DEF_LIMIT);
						channelFound = true;
					}
				}
				// no channel exists with the name that is inside !clean message
				if(!channelFound){
					userMsg.channel.send('Invalid channel input');
				}
			}
			else{
				// if the second element is a number, it should be message deletion limit between 0-100
				if(parseInt(userMsgArr[1]) >= 0 && parseInt(userMsgArr[1]) <= 100){
					// deletes messages on the current channel up to the "parseInt(userMsgArr[1])" -limit
					bulkDeleteMessages(userMsg.channel, parseInt(userMsgArr[1]));
				}
				else{
					// informs user that the message deletion limit is invalid
					userMsg.channel.send('Invalid message limit input, must be between 0-100');
				}
			}
			
		}
		else if(userMsgArr.length === 3){
			// the user command !clear has two parameters
			// the second parameter should be limit for message deletion
			if(!isNaN(parseInt(userMsgArr[2])) && parseInt(userMsgArr[2]) >= 0 && parseInt(userMsgArr[2]) <= 100){
				
				// searches for a channel with the name that is inside !clean message
				let channelFound = false;	// tells if a channel has found that corresponds to user input
				for(let i = 0; i < channelArr.length; i++){
					if(userMsg.content.indexOf(channelArr[i].name) > -1){
						// cleans the messages in the user specified channel if found
						bulkDeleteMessages(channelArr[i], parseInt(userMsgArr[2]));
						channelFound = true;
					}
				}
				// no channel exists with the name that is inside !clean message
				if(!channelFound){
					userMsg.channel.send('Invalid channel input');
				}
				
			}
			else{
				// informs user that the input is invalid
				userMsg.channel.send('Invalid user input, should be "!clean channel-name limit", limit must be 0-100');
			}
		}
		else{
			// the !clean message has too many parameters 
			// informs user that the input is invalid
			userMsg.channel.send('Invalid user input, should be "!clean channel-name limit", limit must be 0-100');
		}
		
	}
	else if(userMsg.content === '!botinfo'){
		// gives info about what the bot does, when user sends '!botinfo'
		userMsg.channel.send('"!clean limit": cleans the current channel of up to 100 and 2 weeks old messages, limit(optional) is number of deleted messages 0-100\n\n' + 
					'"!clean channel-name limit": cleans channel-name of up to 100 and 2 weeks old messages, limit(optional) is number of deleted messages 0-100\n\n' + 
					'"!settime hrs.mins.secs": sets time for daily cleanup for a specified channel, use "." as a separator or the time is invalid, notation follows 24-hour clock, mins and secs optional\n\n' + 
					'"!setchannel channel-name": sets the channel for daily cleanup\n\n' + 
					'"!settimedlimit limit": sets the message deletion limit for timed clean up, limit is number of deleted messages 0-100\n\n' +
					'"!setcleanmsg message": sets message that the bot posts after cleaning a channel\n\n' + 
					'"!delcleanmsg": deletes the message the bot posts after cleaning a channel, no message will be posted\n\n' + 
					'Default message deletion limit is 100 for every command\n\n' + 
					'Currently has scheduled cleanup on channel "' + timedchannel + '"' + ' at ' + cronhour + '.' + cronmin + '.' + cronsec + ', messages to be deleted: ' + timedlimit +'\n\n' +
					'Bot doesn\'t currently use datadase for storing information so data has to be set every time bot goes offline and online again\n\n' + 
					'Remember to give the bot the required permissions to delete/manage messages on the channels you want them deleted\n\n' +
					'Github: https://github.com/aseuna/discord-maid-bot'
 					);
	}
	else if(userMsg.content.startsWith('!settime')){

		// seprates the !settime command from the time user gives
		let time = userMsg.content.substring(9);
		// splits the time string into an array whose cells represent hours, minutes and seconds respectively
		let timeArr = time.split('.');
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
			// timer uses cronjob notation for scheduleJob
			timer = schedule.scheduleJob(cronschedule(cronsec, cronmin, cronhour), function(){
				bulkDeleteMessages(client.channels.find(ch => ch.name === timedchannel), timedlimit);
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
				userMsg.channel.send('Channel is now set for cleaning :sunglasses:');
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
	else if(userMsg.content.startsWith('!settimedlimit')){
		
		// splits user message into an array so each part can be handled separately
		let userMsgArr = userMsg.content.split(' ');
		
		// the second element in the user message should be the message limit parameter, a value between 0-100
		if(!isNaN(parseInt(userMsgArr[1])) && parseInt(userMsgArr[1]) >= 0 && parseInt(userMsgArr[1]) <= 100 && userMsgArr.length === 2){
			
			// sets the timed limit to the value in the user command parameter
			timedlimit = parseInt(userMsgArr[1]);
			userMsg.channel.send('Limit set :sunglasses:');
		}
		else{
			// informs user that the input is invalid
			userMsg.channel.send('Invalid user input, should be "!settimedlimit limit" limit must be 0-100');
		}
		
	}
	
	// user input options end here
	
});



// login to Discord with your app's token
// replace process.env.TOKEN with your own auth token, or put your token in a .env file, more about environment variables here: https://www.twilio.com/blog/2017/08/working-with-environment-variables-in-node-js.html
// DO NOT PUBLICLY RELEASE YOUR AUTH TOKEN
client.login(process.env.TOKEN);