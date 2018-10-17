/////////////////////////////////////////
///////  Developed by Jazora#0001 ///////
/////////////////////////////////////////

const Discord = require("discord.js"); //Discord.js module
const config = require("./botconfig.json"); //bot settings.
const fs = require("fs");
const ytdl = require("ytdl-core");
const config = require("../botconfig.json");
const bot = new Discord.Client();

//CREATING a new map ..
const now = new Map();


//New Collection for FILES.
bot.commands = new Discord.Collection();

const commandFiles = fs.readdirSync("./commands").filter(file => file.endsWith(".js"));

for (const file of commandFiles) {
  const command = require (`./commands/${file}`)
  console.log(`${file} has Loaded`);
  bot.commands.set(command.name, command);
}



bot.on("ready", () => {

    console.log(`logged in as [${bot.user.username}] in ${bot.guilds.size} Servers`);
    console.log("///////////////////////////////\n///Developed by Jazora#0001///\n///  For Adham#7519       ///\n/// ID:390866409195831296///\n///////////////////////////")

    bot.user.setActivity('Type Ahelp', {type: "PLAYING"});

});

bot.on("message", async message => {

  if(!message.content.startsWith(config.prefix) || message.author.bot) return;

  let args = message.content.slice(config.prefix.length).split(' ');
  let command = args.shift().toLowerCase();


  switch(command)
  {

    case 'play':
    bot.commands.get('play').execute(bot,message,args,now);
    break;

    case 'help':
    bot.commands.get('help').execute(bot,message,args);
    break;

    case 'pause':
    bot.commands.get('pause').execute(bot,message,now,args);
    break;

    case 'resume':
    bot.commands.get('resume').execute(bot,message,now,args);
    break;


    case 'skip':
    bot.commands.get('skip').execute(bot,message,args,now);
    break;

    default:
    message.reply(`Invalid Command ${message.content.slice(config.prefix.length)}\nPlease use #help for list of commands`);
    break;
  }

});

module.exports = {
  name:'skip',
  async execute(bot,message,args,now){
    if(!message.member.voiceChannel) return ("You are not in voice channel");

    let fetched = now.get(message.guild.id);

    if(!fetched) return message.reply("Sorry there is no music to skip");

    if(message.member.voiceChannel !== message.guild.me.voiceChannel) return message.reply(`You must be in ***${message.guild.me.voiceChannel.name}*** to skip`);


    now.set(message.guild.id, fetched);

    if (fetched.queue[0]) {
     await message.channel.send('Seccessfully Skipped the Song');
      return fetched.dispatcher.end();
    }

  }
}

module.exports = {
  name:'resume',
  async execute(bot,message,now,args){
    if (!message.member.voiceChannel) return message.reply("You are not in voice channel");

    if(message.member.voiceChannel !== message.guild.me.voiceChannel) return message.reply(`You must be in ***${message.guild.me.voiceChannel.name}*** to Resume`);

    let fetched = now.get(message.guild.id);

    if(!fetched) return message.reply("Sorry there is no song playing right now");

    if(!fetched.dispatcher.paused) return message.reply("This song is not pasued");

    fetched.dispatcher.resume();

    message.reply("Successfully Resumed");
  }
}


const search = require("youtube-search");

var opts = {
  maxResults: 1,
  key: 'AIzaSyA2YG4i9H-4ea1Qv7QD9wphNSez0ReYsbo'
};


module.exports = {
  name:'test',
  async execute(bot,message,args,now){
    search(args.join(' '),opts, (err,Svid) => {

      if(err) {
        message.channel.send("hmmmmmmm something went wrong");
        console.log(err)
        return ;
      }






      let videos = Svid;

      let Svid1 = '';
      for(var i in videos){
        Svid1 += `${videos[i].title}// ${videos[i].link}`;
      }


        let commandFiles = require('./play.js');
        commandFiles.execute(bot,message,[videos[0].link], now).catch(err => console.log(err));

    });
  }
}


module.exports = {
  name:'play',
  async execute(bot,message,args,now) {
    if(!message.member.voiceChannel) return message.reply("You have to be in channel to play music bot");

    if(!message.guild.me.voiceChannel){

    }else if(message.member.voiceChannel !== message.guild.me.voiceChannel){
      return message.channel.send(`You must be in **${message.guild.me.voiceChannel.name}** to play music`);
    }



    if(!args[0])
    {
     await message.member.voiceChannel.join();
      return message.reply(`${config.prefix}play How its work\n\n\`${config.prefix}play <Youtube URL>\` to play youtube links\n\`${config.prefix}play <Song title>\` to play the first result from youtube\n\nEnjoy.`);
    }





    let validate = ytdl.validateURL(args[0]);

    if(!validate){
      let commandsFiles = require ('./playwithsearch.js');
      return commandsFiles.execute(bot,message,args,now);
    }

    let info = await ytdl.getInfo(args[0]);

    let getD = now.get(message.guild.id) || {};

    if(!getD.connection) getD.connection = await message.member.voiceChannel.join();

    if(!getD.queue) getD.queue = [];
    getD.guildID = message.guild.id;

    getD.queue.push({
      songTitle: info.title,
      requested: message.author.tag,
      url: args[0],
      announceChannel: message.channel.id
    });

    if(!getD.dispatcher) play(bot, now, getD);
    else{
      const msg = await message.channel.send(`Searching...`)
      await msg.edit(`Added to Queue: **${info.title}**`)
    }

    now.set(message.guild.id, getD);





  }

}


async function play(bot,now,getD){
  const msg = await bot.channels.get(getD.queue[0].announceChannel).send(`Searching...`)
  await msg.edit(`Now Playing: **${getD.queue[0].songTitle}**`);

 getD.dispatcher = await getD.connection.playStream(ytdl(getD.queue[0].url, {filter: "audioonly"}) );
 getD.dispatcher.guildID = getD.guildID;

 getD.dispatcher.on("end", () =>{
    end(bot,now,getD);
 });
}


function end(bot, now ,getD) {
  let fetched = now.get(getD.dispatcher.guildID);

  fetched.queue.shift();

  if(fetched.queue[0]) {
    now.set(getD.dispatcher.guildID, fetched);


    play(bot,now,fetched);

  } else {
    now.delete(getD.dispatcher.guildID);
  }
}

module.exports = {
  name: 'pause',
  async execute(bot,message,now,args){
    if (!message.member.voiceChannel) return message.reply("You are not in voice channel");

    if(message.member.voiceChannel !== message.guild.me.voiceChannel) return message.reply(`You must be in ***${message.guild.me.voiceChannel.name}*** to Pause`);

    let fetched = now.get(message.guild.id);

    if(!fetched) return message.channgel.send("Sorry there is no song playing right now!");

    if(fetched.dispatcher.pasued) return message.channel.send("Song is already pasued");

    fetched.dispatcher.pause();

    message.reply("Sucessfully Paused");
  }
}

module.exports = {
  name: 'help',
  async execute(bot,message,args) {

    let helpEmbed = new Discord.RichEmbed()
    .setAuthor(message.author.username, message.author.avatarURL)
    .setThumbnail(message.author.avatarURL)
    .setColor("#4800ff")
    .addField("#play","Uses to play song by doing #play Youtube link", true)
    .addField("#pause","to freeze music", true)
    .addField("#resume","to resume music", true)
    .addField("#skip","to skip song", true)
    .setFooter("Developed by Jazora#0001");

    message.channel.send(helpEmbed);
  }


}


client.login(process.env.BOT_TOKEN);
