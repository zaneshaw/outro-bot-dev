const { log } = require("../utils/log");
const { joinVoiceChannel, leaveVoiceChannel } = require("../core");
const Eris = require("eris");

const fakeAudioLength = 5000;
const dcTimeoutDelay = 10000; // 30000
const activeGuilds = [];

class ActiveGuild {
	static GuildState = {
		NONE: "NONE",
		IDLE: "IDLE",
		PLAYING: "PLAYING",
	};
	dcTimeout;

	constructor(guildID, channelID, state = ActiveGuild.GuildState.NONE) {
		this.guildID = guildID;
		this.channelID = channelID;
		this.state = state;

		log(this);
	}

	setState(state) {
		if (this.state != state) {
			// State has changed

			// Clear previous voice disconnect timeout (as bot is no longer inactive)
			clearTimeout(this.dcTimeout);

			if (state == ActiveGuild.GuildState.PLAYING) {
				// New state is 'playing'
				setTimeout(() => {
					// Finished playing audio
					log(`${this.guildID}: Outro finished`);

					this.setState(ActiveGuild.GuildState.IDLE);
				}, fakeAudioLength);
			} else if (state == ActiveGuild.GuildState.IDLE) {
				// New state is 'idle'
				this.dcTimeout = setTimeout(() => {
					// Auto-disconnect from idle timeout
					log(
						`${this.guildID}: Auto-disconnected from voice channel`
					);

					this.setState(ActiveGuild.GuildState.NONE); // Debug line
					leaveVoiceChannel(this.channelID);
					activeGuilds.filter(
						(i) => i !== activeGuilds.indexOf(this)
					);
				}, dcTimeoutDelay);
			}
		}

		// Apply new state
		this.state = state;

		log(this);
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
		await interaction.acknowledge();

		// Outro is not playing in the current guild
		if (guild.state != ActiveGuild.GuildState.PLAYING) {
			// Play outro
			await interaction.createFollowup("Playing outro!");
			guild.channelID = interaction.member.voiceState.channelID;
			guild.setState(ActiveGuild.GuildState.PLAYING);
			await joinVoiceChannel(guild.channelID);
		} else if (guild.state == ActiveGuild.GuildState.PLAYING) {
			// Outro is already playing
			await interaction.createFollowup("Outro is already playing!");
		}
	},
};
