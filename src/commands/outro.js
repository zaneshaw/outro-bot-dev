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

	constructor(guildID, state = ActiveGuild.GuildState.NONE) {
		this.guildID = guildID;
		this.state = state;

		log(this);
	}

	setState(state) {
		if (this.state != state) {
			// State has changed
			if (state == ActiveGuild.GuildState.PLAYING) {
				// New state is playing
				setTimeout(() => {
					// Finished playing audio
					log(`${this.guildID}: Outro finished`);

					this.setState(ActiveGuild.GuildState.IDLE);
				}, fakeAudioLength);
			} else if (state == ActiveGuild.GuildState.IDLE) {
				// New state is idle
				clearTimeout(this.dcTimeout);
				this.dcTimeout = setTimeout(() => {
					log(
						`${this.guildID}: Auto-disconnected from voice channel`
					);

					this.setState(ActiveGuild.GuildState.NONE); // Debug line
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
			guild.setState(ActiveGuild.GuildState.PLAYING);

			const activeChannelId = interaction.member.voiceState.channelID;
			await joinVoiceChannel(activeChannelId);
		} else if (guild.state == ActiveGuild.GuildState.PLAYING) {
			// Outro is already playing
			await interaction.createFollowup("Outro is already playing!");
		}
	},
};
