// MaidBot
// Cleans a text channel with !clean
// user commands start with !

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
let timedlimit = 100;

// default message deletion limit, used when user gives no limit parameter
const DEF_LIMIT = 100;

// default values for cronjob scheduling -- for example 0 0 9 * * * => the task is scheduled every day at 9 am
// changeable with user commands to a desired schedule
let cronhour = undefined;
let cronmin = undefined;
let cronsec = undefined;
const TIMEZONE = 0;		// TIMEZONE the bot is operating on, assuming it's UTC at the moment
let usertimezone = undefined;
let usersummertime = false;

// timer uses cronjob notation for scheduleJob, for example '30 18 * * *'
// timer is by default null, until user sets the time by !settime
let timer = null;

// function returns the schedule in cronjob format used with the schedule timer, more about cronjob here: https://en.wikipedia.org/wiki/Cron
function cronschedule(cronsec, cronmin, cronhour, usertimezone, usersummertime, TIMEZONE){
	console.log(cronsec + ' ' + cronmin + ' ' + cronhour + ' * * *');
	console.log(cronsec + ',' + cronmin + ',' + cronhour + ',' + usertimezone + ',' + usersummertime);
	// this takes the user timezone and summertime into account, though they must be put in manually by the user
	if(usersummertime){
		cronhour = cronhour - (usertimezone + 1) + TIMEZONE;
		if(cronhour < 0){
			cronhour = cronhour + 24;
		}
		else if(cronhour > 23){
			cronhour = cronhour - 24;
		}
	}
	else{
		cronhour = cronhour - usertimezone + TIMEZONE;
		if(cronhour < 0){
			cronhour = cronhour + 24;
		}
		else if(cronhour > 23){
			cronhour = cronhour - 24;
		}
	}
	console.log(cronsec + ' ' + cronmin + ' ' + cronhour + ' * * *');
	return cronsec + ' ' + cronmin + ' ' + cronhour + ' * * *'
}

// the only purpose for this is to make the time formatting look nicer in the schedule info
function formattime(time){
	if(time < 10){
		return '0' + time;
	}
	else{
		return time;
	}
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


client.on('message', function(memberMsg){
	
	// all user input option are below, the user message contains a command starting with !
	
	if(memberMsg.content.startsWith('!clean')){
		
		// checks the memebers permission to delete messages
		if(memberMsg.member.hasPermission('MANAGE_MESSAGES')){
			
			// if user message only contains !clean, the current channel is cleansed
			// sets channels in an array
			let channelArr = client.channels.array();
			// splits user message into an array so each part can be handled separately
			let memberMsgArr = memberMsg.content.split(' ');
			if(memberMsg.content === '!clean'){
				// if there are no cleaning parameters, cleaning current channel with default limit
				bulkDeleteMessages(memberMsg.channel, DEF_LIMIT);
			}
			else if(memberMsgArr.length === 2){
				// checks if the second part of the memberMsg is a number or not
				if(isNaN(parseInt(memberMsgArr[1]))){
					// if the second element is not a number, should be channel name
					// searches for a channel with the name that is inside !clean message
					let channelFound = false;	// tells if a channel has found that corresponds to user input
					for(let i = 0; i < channelArr.length; i++){
						if(memberMsg.content.indexOf(channelArr[i].name) > -1){
							// cleans the messages in the user specified channel if found
							bulkDeleteMessages(channelArr[i], DEF_LIMIT);
							channelFound = true;
						}
					}
					// no channel exists with the name that is inside !clean message
					if(!channelFound){
						memberMsg.channel.send('Invalid channel input');
					}
				}
				else{
					// if the second element is a number, it should be message deletion limit between 0-100
					if(parseInt(memberMsgArr[1]) >= 0 && parseInt(memberMsgArr[1]) <= 100){
						// deletes messages on the current channel up to the "parseInt(memberMsgArr[1])" -limit
						bulkDeleteMessages(memberMsg.channel, parseInt(memberMsgArr[1]));
					}
					else{
						// informs user that the message deletion limit is invalid
						memberMsg.channel.send('Invalid message limit input, must be between 0-100');
					}
				}
				
			}
			else if(memberMsgArr.length === 3){
				// the user command !clear has two parameters
				// the second parameter should be limit for message deletion
				if(!isNaN(parseInt(memberMsgArr[2])) && parseInt(memberMsgArr[2]) >= 0 && parseInt(memberMsgArr[2]) <= 100){
					
					// searches for a channel with the name that is inside !clean message
					let channelFound = false;	// tells if a channel has found that corresponds to user input
					for(let i = 0; i < channelArr.length; i++){
						if(memberMsg.content.indexOf(channelArr[i].name) > -1){
							// cleans the messages in the user specified channel if found
							bulkDeleteMessages(channelArr[i], parseInt(memberMsgArr[2]));
							channelFound = true;
						}
					}
					// no channel exists with the name that is inside !clean message
					if(!channelFound){
						memberMsg.channel.send('Invalid channel input');
					}
					
				}
				else{
					// informs user that the input is invalid
					memberMsg.channel.send('Invalid user input, should be "!clean channel-name limit", limit must be 0-100');
				}
			}
			else{
				// the !clean message has too many parameters 
				// informs user that the input is invalid
				memberMsg.channel.send('Invalid user input, should be "!clean channel-name limit", limit must be 0-100');
			}
		}
		else{
			// memeber has no permission to manage messages so dm is sent
			memberMsg.author.send('Invalid permission, need permission to delete messages');
		}
	}
	else if(memberMsg.content.startsWith('!settime') && !memberMsg.content.startsWith('!settimezone')){
		
		// checks the memebers permission to delete messages
		if(memberMsg.member.hasPermission('MANAGE_MESSAGES')){
			
		
			// user must set timezone before setting cleanup time for bot to know exact time to clean messages
			if(usertimezone !== undefined){
				// seprates the !settime command from the time user gives
				let time = memberMsg.content.substring(9);
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
					timer = schedule.scheduleJob(cronschedule(cronsec, cronmin, cronhour, usertimezone, usersummertime, TIMEZONE), function(){
						bulkDeleteMessages(client.channels.find(ch => ch.name === timedchannel), timedlimit);
					});
					
					memberMsg.channel.send('Clean time is now set :sunglasses:');
				}
				else{
					// informs user in input was invalid
					memberMsg.channel.send('Invalid time input');
				}
			}
			else{
				// user must set timezone before setting cleanup time for bot to know exact time to clean messages
				memberMsg.channel.send('You must set timezone before setting time, otherwise bot doesn\'t know the exact time to clean messages\n' + 
				'example "!settimezone utc+2 summertime", summertime optional');
			}
			
		}
		else{
			// memeber has no permission to manage messages so dm is sent
			memberMsg.author.send('Invalid permission, need permission to delete messages');
		}	
	}
	else if(memberMsg.content.startsWith('!settimezone')){
		
		// checks the memebers permission to delete messages
		if(memberMsg.member.hasPermission('MANAGE_MESSAGES')){
		
			// splits user message into an array so each part can be handled separately
			let memberMsgArr = memberMsg.content.split(' ');
			
			// checks if the second element(or the first parameter in the user message) has UTC+timzone or UTC in it
			if(!isNaN(parseInt(memberMsgArr[1].substring(3))) || memberMsgArr[1].toLowerCase() === 'utc'){
				
				// cheacks if there is a summertime parameter
				if(memberMsgArr[2] === undefined){
					// no summertime parameter
					usersummertime = false;
					// parses the timezone part of the user comment if there is one, otherwise user timezone is UTC
					if(!isNaN(parseInt(memberMsgArr[1].substring(3)))){
						usertimezone = parseInt(memberMsgArr[1].substring(3));
					}
					else{
						usertimezone = 0;
					}
					
					memberMsg.channel.send('Timezone set :sunglasses:');
				}
				else if(memberMsgArr[2].toLowerCase() === 'summertime'){
					// summertime parameter present
					usersummertime = true;
					// parses the timezone part of the user comment if there is one, otherwise user timezone is UTC
					if(!isNaN(parseInt(memberMsgArr[1].substring(3)))){
						usertimezone = parseInt(memberMsgArr[1].substring(3));
					}
					else{
						usertimezone = 0;
					}
					
					memberMsg.channel.send('Timezone set :sunglasses:');
				}
				else if(memberMsg[1] === undefined){
					// if user input parameter are not valid, inform user
					memberMsg.channel.send('Timezone input invalid, example "!settimezone UTC+2 summertime", summertime optional');
				}
				else{
					// if user input parameter are not valid, inform user
					memberMsg.channel.send('Timezone input invalid, example "!settimezone UTC+2 summertime", summertime optional');
				}
				
			}
			else{
				// if user input parameter are not valid, inform user
				memberMsg.channel.send('Timezone input invalid, example "!settimezone UTC+2 summertime", summertime optional');
			}
		}
		else{
			// memeber has no permission to manage messages so dm is sent
			memberMsg.author.send('Invalid permission, need permission to delete messages');
		}
		
	}
	else if(memberMsg.content.startsWith('!setchannel')){
		
		// checks the memebers permission to delete messages
		if(memberMsg.member.hasPermission('MANAGE_MESSAGES')){
			
			let channelFound = false;	// tells if a channel has found that corresponds to user input
			let channelArr = client.channels.array();
			// searches for a channel with the name that is inside !setchannel message
			for(let i = 0; i < channelArr.length; i++){
				if(memberMsg.content.indexOf(channelArr[i].name) > -1){
					// sets timedchannel, which is the channel to be cleaned,
					timedchannel = channelArr[i].name;
					channelFound = true;
					memberMsg.channel.send('Channel is now set for cleaning :sunglasses:');
				}
			}
			
			if(!channelFound){
				memberMsg.channel.send('Invalid channel input');
			}
			
		}
		else{
			// memeber has no permission to manage messages so dm is sent
			memberMsg.author.send('Invalid permission, need permission to delete messages');
		}
	}
	else if(memberMsg.content.startsWith('!settimedlimit')){
		
		// checks the memebers permission to delete messages
		if(memberMsg.member.hasPermission('MANAGE_MESSAGES')){
			
			// splits user message into an array so each part can be handled separately
			let memberMsgArr = memberMsg.content.split(' ');
			
			// the second element in the user message should be the message limit parameter, a value between 0-100
			if(!isNaN(parseInt(memberMsgArr[1])) && parseInt(memberMsgArr[1]) >= 0 && parseInt(memberMsgArr[1]) <= 100 && memberMsgArr.length === 2){
				
				// sets the timed limit to the value in the user command parameter
				timedlimit = parseInt(memberMsgArr[1]);
				memberMsg.channel.send('Limit set :sunglasses:');
			}
			else{
				// informs user that the input is invalid
				memberMsg.channel.send('Invalid user input, should be "!settimedlimit limit" limit must be 0-100');
			}
			
		}
		else{
			// memeber has no permission to manage messages so dm is sent
			memberMsg.author.send('Invalid permission, need permission to delete messages');
		}
	}
	else if(memberMsg.content === '!clearsch'){
		
		// checks the memebers permission to delete messages
		if(memberMsg.member.hasPermission('MANAGE_MESSAGES')){
			
			// clears the current schedule
			if(timer !== null){
				timer.cancel();
			}
			// sets the time variables to undefined for !schedule info
			cronhour = undefined;
			cronmin = undefined;
			cronsec = undefined;
			
		}
		else{
			// memeber has no permission to manage messages so dm is sent
			memberMsg.author.send('Invalid permission, need permission to delete messages');
		}
		
	}
	else if(memberMsg.content === '!schedule'){
		// if user message is !schedule, bot gives info about current cleanup schedule
		memberMsg.channel.send('Currently has scheduled cleanup on channel "' + timedchannel + '"' + ' at ' + formattime(cronhour) + '.' + formattime(cronmin) + '.' + formattime(cronsec) + ', messages to be deleted: ' + timedlimit +'\n\n' +
					'Timezone details: ' + 'UTC' + usertimezone + ' summertime: ' + usersummertime + '\n\n'
		);
	}
	else if(memberMsg.content.startsWith('!setcleanmsg')){
		// sets message for bot that is posted after channel clean up
		cleanmsg = memberMsg.content.substring(14);
	}
	else if(memberMsg.content.startsWith('!delcleanmsg')){
		// sets clean up message to null
		// no message is posted
		cleanmsg = null;
	}
	else if(memberMsg.content === '!botinfo'){
		// gives info about what the bot does, when user sends '!botinfo'
		memberMsg.channel.send('"!clean limit": cleans the current channel of up to 100 and 2 weeks old messages, limit(optional) is number of deleted messages 0-100\n\n' + 
					'"!clean channel-name limit": cleans channel-name of up to 100 and 2 weeks old messages, limit(optional) is number of deleted messages 0-100\n\n' + 
					'"!settime hrs.mins.secs": sets time for daily cleanup for a specified channel, use "." as a separator or the time is invalid, notation follows 24-hour clock, mins and secs optional\n\n' + 
					'"!setchannel channel-name": sets the channel for daily cleanup\n\n' + 
					'"!settimedlimit limit": sets the message deletion limit for timed clean up, limit is number of deleted messages 0-100\n\n' +
					'"!settimezone timezone summertime": sets the timezone you want, timezone in format for example UTC+2, summertime optional, write the string summertime as parameter\n\n' + 
					'"!clearsch": cancels the current schedule\n\n' + 
					'"!schedule": gives current cleanup schedule details\n\n' +
					'"!setcleanmsg message": sets message that the bot posts after cleaning a channel\n\n' + 
					'"!delcleanmsg": deletes the message the bot posts after cleaning a channel, no message will be posted\n\n' + 
					'Default message deletion limit is 100 for every command\n\n' + 
					'Bot doesn\'t currently use datadase for storing information so data has to be set every time bot goes offline and online again\n\n' + 
					'Remember to give the bot the required permissions to delete/manage messages on the channels you want them deleted\n\n' +
					'Github: https://github.com/aseuna/discord-maid-bot'
 					);
	}
	
	
	// user input options end here
	
});



// login to Discord with your app's token
// replace process.env.TOKEN with your own auth token, or put your token in a .env file, more about environment variables here: https://www.twilio.com/blog/2017/08/working-with-environment-variables-in-node-js.html
// DO NOT PUBLICLY RELEASE YOUR AUTH TOKEN
client.login(process.env.TOKEN);