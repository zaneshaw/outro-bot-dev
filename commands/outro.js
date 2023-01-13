const path = require("node:path");
const { SlashCommandBuilder, Collection } = require("discord.js");
const { joinVoiceChannel, createAudioPlayer, createAudioResource, AudioPlayerStatus, NoSubscriberBehavior } = require("@discordjs/voice");
const { log } = require("../util/log");

const delay = 15000;
const idleTimeout = 30000;
let states = new Collection();
let outroCount = 0;

module.exports = {
	data: new SlashCommandBuilder()
		.setName("outro")
		.setDescription("Plays outro!"),
	async execute(interaction) {
		const guild = interaction.guild;
		const member = interaction.member;
		const channelId = member.voice.channelId;
		if (!states.get(guild)) {
			const state = {
				playing: false,
				user: null
			};
			states.set(guild, state);
		}

		if (states.get(guild)?.user == member) {
			interaction.reply({
				content: "You're already playing an outro!",
				ephemeral: true
			});
			return;
		}
		if (!channelId) {
			interaction.reply({
				content: "You must be in a voice channel to play an outro!",
				ephemeral: true
			});
			return;
		};
		if (states.get(guild)?.playing) {
			handleAlreadyPlaying(interaction);
			return;
		}

		interaction.reply("Playing outro!");
		states.set(guild, {
			playing: true,
			user: member
		});
		outroCount++;
		updateActivity(interaction.client);

		const connection = joinVoiceChannel({
			channelId: channelId,
			guildId: guild.id,
			adapterCreator: guild.voiceAdapterCreator,
		});
		const player = createAudioPlayer({
			behaviors: {
				noSubscriber: NoSubscriberBehavior.Play
			}
		});
		const resource = createAudioResource(path.resolve("./audio/xenogenesis.mp3"), { inlineVolume: true });
		resource.volume?.setVolume(0.15);

		player.play(resource);
		connection.subscribe(player);

		player.on(AudioPlayerStatus.Playing, () => {
			log("Audio player is playing audio");
			handleAudioPlayer(interaction, connection);
		});

		player.on(AudioPlayerStatus.Paused, () => {
			log("Paused...");
		});

		player.on(AudioPlayerStatus.Idle, () => {
			log("Audio player is now idle");
			handleAudioPlayerIdle(connection, player);
		});
	},
};

function updateActivity(client) {
	client.user.setActivity(`${outroCount} outro${outroCount === 1 ? "" : "s"}!`);
}

function handleAudioPlayer(interaction, connection,) {
	const guild = interaction.guild;

	setTimeout(async () => {
		if (states.get(guild)?.playing && connection.state.status !== "disconnected") {
			await interaction.member.voice.disconnect();
			interaction.followUp({
				content: "Your outro finished!",
				ephemeral: true
			});

			log("Kicked user");
		}
		states.set(guild, {
			playing: false,
			user: null
		});
		outroCount--;
		updateActivity(interaction.client);
	}, delay);
}

function handleAudioPlayerIdle(connection, player) {
	setTimeout(() => {
		if (player.state.status === "idle" && connection.state.status !== "disconnected" && player.state.status !== "destroyed") {
			log("Disconnecting from voice channel");
			connection.destroy();
		}
	}, idleTimeout);
}

function handleAlreadyPlaying(interaction) {
	setTimeout(() => {
		// Will be a little early because of audio play delay (or a little late because of reply time)
		if (states.get(guild)?.playing) {
			interaction.followUp({
				content: "You can now start your outro!",
				ephemeral: true
			});
		}
	}, delay);
	interaction.reply({
		content: "An outro is already playing!",
		ephemeral: true
	});
}