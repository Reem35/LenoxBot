const Discord = require('discord.js');
exports.run = client => {
	const chalk = require('chalk');
	client.user.setPresence({
		game: {
			name: `?help | www.lenoxbot.com`,
			type: 0
		}
	});

	const users = [];
	for (const discordUser of client.users.array()) {
		const user = { id: discordUser.id, username: discordUser.username, discriminator: discordUser.discriminator, avatar: discordUser.avatar };
		users.push(user);
	}
	const bulkMessage = { type: 'bulk', data: users };
	process.send(bulkMessage);

	if (client.provider.isReady) {
		console.log(chalk.green('LenoxBot is ready!'));
	} else {
		client.provider.whenReady(async () => {
			console.log(chalk.green('LenoxBot is ready!'));

			// Sets all marketitems
			const marketconfs = require('../marketitems-keys.json');
			await client.provider.setBotsettings('botconfs', 'market', marketconfs);

			// Sets the prefix for every guild
			for (let i = 0; i < client.guilds.array().length; i++) {
				if (client.provider.getGuild(client.guilds.array()[i].id, 'prefix')) {
					client.guilds.array()[i]._commandPrefix = client.provider.getGuild(client.guilds.array()[i].id, 'prefix');
				}
			}

			await client.provider.setBotsettings('botconfs', 'botstats', {
				botguildscount: client.guilds.size,
				botmemberscount: client.users.size,
				botcommands: client.provider.getBotsettings('botconfs', 'commandsexecuted'),
				botcommandsincrement: Math.floor(client.provider.getBotsettings('botconfs', 'commandsexecuted') / 170) + 1,
				botmemberscountincrement: Math.floor(client.users.size / 170) + 1,
				botguildscountincrement: Math.floor(client.guilds.size / 170) + 1
			});

			function timeoutForDaily(dailyreminder, timeoutTime) {
				setTimeout(async () => {
					client.users.get(dailyreminder.userID).send('Don\'t forget to pick up your daily reward');
					const currentDailyreminder = client.provider.getBotsettings('botconfs', 'dailyreminder');
					delete currentDailyreminder[dailyreminder.userID];
					await client.provider.setBotsettings('botconfs', 'dailyreminder', currentDailyreminder);
				}, timeoutTime);
			}

			if (typeof client.provider.getBotsettings('botconfs', 'dailyreminder') !== 'undefined') {
				if (Object.keys(client.provider.getBotsettings('botconfs', 'dailyreminder')).length !== 0) {
					/* eslint guard-for-in: 0 */
					for (const index in client.provider.getBotsettings('botconfs', 'dailyreminder')) {
						const timeoutTime = client.provider.getBotsettings('botconfs', 'dailyreminder')[index].remind - Date.now();
						timeoutForDaily(client.provider.getBotsettings('botconfs', 'dailyreminder')[index], timeoutTime);
					}
				}
			}

			function timeoutForJob(jobreminder, timeoutTime) {
				setTimeout(async () => {
					await client.provider.setUser(jobreminder.userID, 'jobstatus', false);

					const newCurrentJobreminder = client.provider.getBotsettings('botconfs', 'jobreminder');
					delete newCurrentJobreminder[jobreminder.userID];
					await client.provider.setBotsettings('botconfs', 'jobreminder', newCurrentJobreminder);

					let currentCredits = client.provider.getUser(jobreminder.userID, 'credits');
					currentCredits += jobreminder.amount;
					await client.provider.setUser(jobreminder.userID, 'credits', currentCredits);

					const jobfinish = `Congratulations! You have successfully completed your job. You earned a total of ${jobreminder.amount} credits`;
					client.users.get(jobreminder.userID).send(jobfinish);

					const activityEmbed2 = new Discord.MessageEmbed()
						.setAuthor(`${client.users.get(jobreminder.userID).tag} (${jobreminder.userID})`, client.users.get(jobreminder.userID).displayAvatarURL())
						.setDescription(`**Job:** ${jobreminder.job} \n**Duration:** ${jobreminder.jobtime} minutes \n**Amount:** ${jobreminder.amount} credits`)
						.addField('Guild', `${client.guilds.get(jobreminder.discordServerID).name} (${jobreminder.discordServerID})`)
						.addField('Channel', `${client.channels.get(jobreminder.channelID).name} (${jobreminder.channelID})`)
						.setColor('AQUA')
						.setFooter('JOB FINISHED')
						.setTimestamp();
					if (client.provider.getBotsettings('botconfs', 'activity') === true) {
						const messagechannel = client.channels.get(client.provider.getBotsettings('botconfs', 'activitychannel'));
						messagechannel.send({
							embed: activityEmbed2
						});
					}
				}, timeoutTime);
			}

			if (typeof client.provider.getBotsettings('botconfs', 'jobreminder') !== 'undefined') {
				if (Object.keys(client.provider.getBotsettings('botconfs', 'jobreminder')).length !== 0) {
					/* eslint guard-for-in: 0 */
					for (const index in client.provider.getBotsettings('botconfs', 'jobreminder')) {
						const timeoutTime = client.provider.getBotsettings('botconfs', 'jobreminder')[index].remind - Date.now();
						timeoutForJob(client.provider.getBotsettings('botconfs', 'jobreminder')[index], timeoutTime);
					}
				}
			}

			function timeoutForBan(bansconf, newBanTime, fetchedbansfromfunction) {
				setTimeout(async () => {
					const langSet = client.provider.getGuild(bansconf.discordserverid, 'language');
					const lang = require(`../languages/${langSet}.json`);
					const fetchedbans = fetchedbansfromfunction;

					if (fetchedbans.has(bansconf.memberid)) {
						const user = fetchedbans.get(bansconf.memberid);

						client.guilds.get(bansconf.discordserverid).members.unban(user);

						const unbannedby = lang.unban_unbannedby.replace('%authortag', `${client.user.tag}`);
						const automaticbandescription = lang.temporaryban_automaticbandescription.replace('%usertag', `${user.username}#${user.discriminator}`).replace('%userid', user.id);
						const unmutedembed = new Discord.MessageEmbed()
							.setAuthor(unbannedby, client.user.displayAvatarURL())
							.setThumbnail(user.displayAvatarURL())
							.setColor('#FF0000')
							.setTimestamp()
							.setDescription(automaticbandescription);

						if (client.provider.getGuild(bansconf.discordserverid, 'modlog') === 'true') {
							const modlogchannel = client.channels.get(client.provider.getGuild(bansconf.discordserverid, 'modlogchannel'));
							modlogchannel.send({
								embed: unmutedembed
							});
						}

						const currentPunishments = client.provider.getGuild(bansconf.discordserverid, 'punishments');
						const punishmentConfig = {
							id: currentPunishments.length + 1,
							userId: user.id,
							reason: 1,
							date: Date.now(),
							moderatorId: client.user.id,
							type: 'unban'
						};

						currentPunishments.push(punishmentConfig);
						await client.provider.setGuild(bansconf.discordserverid, 'punishments', currentPunishments);
					}
					const newbansconf = client.provider.getBotsettings('botconfs', 'bans');
					delete newbansconf[client.provider.getBotsettings('botconfs', 'banscount')];
					await client.provider.setBotsettings('botconfs', 'bans', newbansconf);
				}, newBanTime);
			}

			function timeoutForMute(muteconf, newMuteTime) {
				setTimeout(async () => {
					const guild = client.guilds.get(muteconf.discordserverid);
					if (!guild) return;

					const membermention = await guild.members.fetch(muteconf.memberid).catch(() => undefined);
					if (!membermention) return undefined;

					const role = client.guilds.get(muteconf.discordserverid).roles.get(muteconf.roleid);
					if (!role) return undefined;

					const user = client.users.get(muteconf.memberid);
					if (!user) return undefined;

					const langSet = client.provider.getGuild(muteconf.discordserverid, 'language');
					const lang = require(`../languages/${langSet}.json`);

					if (client.provider.getGuild(muteconf.discordserverid, 'muterole') !== '' && membermention.roles.has(client.provider.getGuild(muteconf.discordserverid, 'muterole'))) {
						membermention.roles.remove(role);

						const unmutedby = lang.unmute_unmutedby.replace('%authortag', `${client.user.tag}`);
						const automaticunmutedescription = lang.unmute_automaticunmutedescription.replace('%usertag', `${user.username}#${user.discriminator}`).replace('%userid', user.id);
						const unmutedembed = new Discord.MessageEmbed()
							.setAuthor(unmutedby, client.user.displayAvatarURL())
							.setThumbnail(user.displayAvatarURL())
							.setColor('#FF0000')
							.setTimestamp()
							.setDescription(automaticunmutedescription);

						user.send({
							embed: unmutedembed
						});

						if (client.provider.getGuild(muteconf.discordserverid, 'modlog') === 'true') {
							const modlogchannel = client.channels.get(client.provider.getGuild(muteconf.discordserverid, 'modlogchannel'));
							modlogchannel.send({
								embed: unmutedembed
							});
						}

						const currentPunishments = client.provider.getGuild(muteconf.discordserverid, 'punishments');
						const punishmentConfig = {
							id: currentPunishments.length + 1,
							userId: user.id,
							reason: 1,
							date: Date.now(),
							moderatorId: client.user.id,
							type: 'unmute'
						};

						currentPunishments.push(punishmentConfig);
						await client.provider.setGuild(muteconf.discordserverid, 'punishments', currentPunishments);
					}
					const newmuteconf = client.provider.getBotsettings('botconfs', 'mutes');
					delete newmuteconf[muteconf.mutescount];
					await client.provider.setBotsettings('botconfs', 'mutes', newmuteconf);
				}, newMuteTime);
			}

			if (typeof client.provider.getBotsettings('botconfs', 'bans') !== 'undefined') {
				if (Object.keys(client.provider.getBotsettings('botconfs', 'bans')).length !== 0) {
					for (const index in client.provider.getBotsettings('botconfs', 'bans')) {
						const newBanTime = client.provider.getBotsettings('botconfs', 'bans')[index].banEndDate - Date.now();
						const fetchedbans = await client.guilds.get(client.provider.getBotsettings('botconfs', 'bans')[index].discordserverid).fetchBans();
						timeoutForBan(client.provider.getBotsettings('botconfs', 'bans')[index], newBanTime, fetchedbans);
					}
				}
			}


			if (typeof client.provider.getBotsettings('botconfs', 'mutes') !== 'undefined') {
				if (Object.keys(client.provider.getBotsettings('botconfs', 'mutes')).length !== 0) {
					for (const index2 in client.provider.getBotsettings('botconfs', 'mutes')) {
						const newMuteTime = client.provider.getBotsettings('botconfs', 'mutes')[index2].muteEndDate - Date.now();
						timeoutForMute(client.provider.getBotsettings('botconfs', 'mutes')[index2], newMuteTime);
					}
				}
			}
			setInterval(() => {
				client.guilds.filter(g => client.provider.getGuild(g.id, 'prefix')).forEach(async g => {
					if (client.provider.getGuild(g.id, 'premium')) {
						if (client.provider.getGuild(g.id, 'premium').status === true) {
							if (new Date().getTime() >= Date.parse(client.provider.get(g.id, 'premium').end)) {
								const currentPremium = client.provider.getGuild(g.id, 'premium');
								currentPremium.status = false;
								currentPremium.bought = [];
								currentPremium.end = '';
								await client.provider.setGuild(g.id, 'premium', currentPremium);
							}
						}
					}
				});
			}, 86400000);

			setInterval(() => {
				client.users.filter(g => client.provider.getUser(g.id, 'credits')).forEach(async g => {
					if (client.provider.getUser(g.id, 'premium')) {
						if (client.userdb.get(g.id).premium.status === true) {
							if (new Date().getTime() >= Date.parse(client.provider.getUser(g.id, 'premium').end)) {
								const currentPremium = client.provider.getUser(g.id, 'premium');
								currentPremium.status = false;
								currentPremium.bought = [];
								currentPremium.end = '';
								await client.provider.setUser(g.id, 'premium', currentPremium);
							}
						}
					}
				});
			}, 86400000);

			const validation = ['administration', 'help', 'music', 'fun', 'searches', 'nsfw', 'utility', 'botowner', 'moderation', 'staff', 'application', 'currency', 'partner', 'tickets', 'customcommands'];
			const commandsArray = [];
			const englishLang = require(`../languages/en-US.json`);
			for (let i = 0; i < validation.length; i++) {
				for (let index = 0; index < client.registry.commands.filter(c => c.groupID === validation[i]).array().length; index++) {
					const commandObject = {};
					commandObject.category = client.registry.commands.filter(c => c.groupID === validation[i]).array()[index].groupID;
					commandObject.name = client.registry.commands.filter(c => c.groupID === validation[i]).array()[index].name;
					commandObject.description = englishLang[`${client.registry.commands.filter(c => c.groupID === validation[i]).array()[index].name}_description`] ? englishLang[`${client.registry.commands.filter(c => c.groupID === validation[i]).array()[index].name}_description`] : client.registry.commands.filter(c => c.groupID === validation[i]).array()[index].name.description;
					commandObject.newaliases = client.registry.commands.filter(c => c.groupID === validation[i]).array()[index].aliases;
					commandObject.newuserpermissions = client.registry.commands.filter(c => c.groupID === validation[i]).array()[index].userpermissions;
					commandObject.usage = client.registry.commands.filter(c => c.groupID === validation[i]).array()[index].format;
					commandObject.dashboardsettings = client.registry.commands.filter(c => c.groupID === validation[i]).array()[index].dashboardsettings;
					commandsArray.push(commandObject);
				}
			}
			await client.provider.setBotsettings('botconfs', 'commands', commandsArray);

			setInterval(async () => {
				const commandsArray2 = [];
				for (let i = 0; i < validation.length; i++) {
					for (let index = 0; index < client.registry.commands.filter(c => c.groupID === validation[i]).array().length; index++) {
						const commandObject = {};
						commandObject.category = client.registry.commands.filter(c => c.groupID === validation[i]).array()[index].groupID;
						commandObject.name = client.registry.commands.filter(c => c.groupID === validation[i]).array()[index].name;
						commandObject.description = englishLang[`${client.registry.commands.filter(c => c.groupID === validation[i]).array()[index].name}_description`] ? englishLang[`${client.registry.commands.filter(c => c.groupID === validation[i]).array()[index].name}_description`] : client.registry.commands.filter(c => c.groupID === validation[i]).array()[index].name.description;
						commandObject.newaliases = client.registry.commands.filter(c => c.groupID === validation[i]).array()[index].aliases;
						commandObject.newuserpermissions = client.registry.commands.filter(c => c.groupID === validation[i]).array()[index].userpermissions;
						commandObject.usage = client.registry.commands.filter(c => c.groupID === validation[i]).array()[index].format;
						commandObject.dashboardsettings = client.registry.commands.filter(c => c.groupID === validation[i]).array()[index].dashboardsettings;
						commandsArray2.push(commandObject);
					}
				}
				await client.provider.setBotsettings('botconfs', 'commands', commandsArray2);
			}, 86400000);

			/* if (client.shard.ids[0] === 0) {
				const userData = {};
				userData.loaded = false;
				let userArray = [];
				const arrayOfUsers = await client.provider.userSettings;
				for (let i = 0; i < Object.keys(arrayOfUsers).length; i++) {
					if (!isNaN(arrayOfUsers[key].credits)) {
						await client.users.fetch(arrayOfUsers[key].userId).then(userResult => {
							console.log(userResult);
							const userCreditsSettings = {
								userId: key.userId,
								user: userResult ? userResult : arrayOfUsers[key].userId,
								credits: Number(arrayOfUsers[key].credits)
							};
							if (Object.keys(arrayOfUsers[key])[0].userId !== 'global') {
								userArray.push(userCreditsSettings);
							}
						});
					}
				}

				userArray = userArray.sort((a, b) => {
					if (a.credits < b.credits) {
						return 1;
					}
					if (a.credits > b.credits) {
						return -1;
					}
					return 0;
				});

				for (let i = 0; i < userArray.length; i++) {
					await shardingManager.shards.get(0).eval(`
					(async () => {
						const user = await this.users.fetch("${arrayofUsers[i].userId}")
						if (user) return user;
					})();
				`).then(userResult => {
						if (userResult) {
							userArray[i].user = userResult;
						}
						if (req.user) {
							if (userArray[i].userId === req.user.id) {
								userData.place = i + 1;
								userData.credits = userArray[i].credits;
								userData.loaded = true;
							}
						}
					});
				}
			}*/

			const embed = new Discord.MessageEmbed()
				.setTitle('Botrestart')
				.setDescription('LenoxBot had a restart and is back again!\nEveryone can now execute commands!')
				.setColor('GREEN')
				.setTimestamp()
				.setAuthor(client.user.tag, client.user.displayAvatarURL());

			if (client.user.id === '354712333853130752') {
				client.channels.get('497400107109580801').send({
					embed
				});
			}
		});
	}
};

