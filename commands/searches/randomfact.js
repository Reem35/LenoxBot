const Discord = require('discord.js');

exports.run = (client, msg, args, lang) => {
    var rf = require('random-facts');
    msg.channel.send(rf.randomFact());
};

exports.conf = {
	enabled: true,
	guildOnly: true,
	aliases: [],
    userpermissions: []
};
exports.help = {
	name: 'randomfact',
	description: 'Random facts (in English only)',
	usage: 'randomfact',
	example: ['randomfact'],
	category: 'searches',
    botpermissions: ['SEND_MESSAGES']
};