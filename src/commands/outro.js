const path = require("node:path");
const { log } = require("../utils/log");
const core = require("../core");
const Eris = require("eris");

const kickMemberDelay = 15000;
const dcTimeoutDelay = 10000; // 30000
const activeGuilds = [];

class ActiveGuild {
	static GuildState = {
		IDLE: "IDLE",
		PLAYING: "PLAYING",
	};
	dcTimeout;

	constructor(guildID, channelID, state = null) {
		this.guildID = guildID;
		this.channelID = channelID;
		this.state = state;

		log("Guild is now active", { log: false, subDir: this.guildID });
	}

	setState(state) {
		if (this.state != state) {
			// State has changed

			// Clear previous voice disconnect timeout (as bot is no longer inactive)
			clearTimeout(this.dcTimeout);

			if (state == ActiveGuild.GuildState.IDLE) {
				// New state is IDLE
				this.dcTimeout = setTimeout(() => {
					// Auto-disconnect from idle timeout
					log(
						"Auto-disconnected from voice channel (Guild is now inactive)",
						{
							log: false,
							subDir: this.guildID,
						}
					);

					core.leaveVoiceChannel(this.channelID);
					activeGuilds.filter(
						(i) => i !== activeGuilds.indexOf(this)
					);
				}, dcTimeoutDelay);
			}

			// Apply new state
			this.state = state;
			core.updateOutroCount(
				activeGuilds.filter(
					(guild) => guild.state === ActiveGuild.GuildState.PLAYING
				).length
			);

			log(`State changed: ${this.state}`, {
				log: false,
				subDir: this.guildID,
			});
		}
	}
}

module.exports = {
	/**
	 * @param {Eris.CommandInteraction<Eris.TextableChannel>} interaction Command interaction
	 */
	async run(interaction) {
		// Get current guild
		let guild = activeGuilds.find(
			(guild) => guild.guildID === interaction.guildID
		);

		// Initialise connection if it isn't active
		if (guild == null) {
			guild = new ActiveGuild(interaction.guildID);
			activeGuilds.push(guild);
		}

		// Acknowledge the interaction
		await interaction.acknowledge(64); // 64 = ephemeral
		if (interaction.member.voiceState.channelID == null) {
			await interaction.createFollowup(
				"You must be in a voice channel to play an outro!"
			); // useless 'await'?
			return;
		}

		// Outro is not playing in the current guild
		if (guild.state != ActiveGuild.GuildState.PLAYING) {
			// Play outro
			guild.channelID = interaction.member.voiceState.channelID;
			const connection = await core.joinVoiceChannel(guild.channelID);

			connection.on("start", async () => {
				guild.setState(ActiveGuild.GuildState.PLAYING);
				await interaction.createFollowup("Playing outro!"); // useless 'await'?
			});

			connection.on("end", () => {
				// Finished playing audio
				guild.setState(ActiveGuild.GuildState.IDLE);

				log("Audio finished", { log: false, subDir: guild.guildID });
			});

			if (connection.playing) connection.stopPlaying(); // Cancel current audio
			const resource = path.resolve("./src/data/xenogenesis.wav");

			connection.play(resource, { inlineVolume: true });
			connection.setVolume(0.1);

			setTimeout(async () => {
				if (
					connection.playing &&
					guild.state == ActiveGuild.GuildState.PLAYING
				) {
					// Kick member if music is still playing
					interaction.member.edit({ channelID: null });
					log(`Kicked member (${interaction.member.id})`, {
						log: false,
						subDir: guild.guildID,
					});
				}
			}, kickMemberDelay);
		} else if (guild.state == ActiveGuild.GuildState.PLAYING) {
			// Outro is already playing
			await interaction.createFollowup("Outro is already playing!");
		}

		log(`Playing outro (${interaction.member.id})`, {
			log: false,
			subDir: guild.guildID,
		});
	},
};
