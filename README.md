# discord-maid-bot
Bot for cleaning text channels in discord.

- scheduled cleaning once a day
	- user can set scheduled clean time by !settime hrs.mins.secs, the notation follows 24-hour clock
	- user can set the channel to be cleaned by !setchannel
	- at the moment there is no datadase for storing information, clean up channel and time has to be set every time bot goes offline and online again
- user requested cleaning with command !cleanse or !cleanse 'channel name'
- user can set and delete a message that bot posts by !setcleanmsg 'message' and !delcleanmsg

Make sure the bot has the rights for managing/deleting messages from the channels you want it to delete messages.


Uses discord.js. To use this bot you have to have node.js installed alongside with discord.js and node-schedule -modules. This repo only provides the source code for the bot itself. 

node-schedule module by Matt Patenaude
