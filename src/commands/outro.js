const { log } = require("../utils/log");
const Eris = require("eris");

const delay = 15000;
const idleTimeout = 30000;
const activeGuilds = [];

class ActiveGuild {
	static GuildState = {
		IDLE: "IDLE",
		PLAYING: "PLAYING",
	};

	constructor(guildID, state = ActiveGuild.GuildState.IDLE) {
		this.guildID = guildID;
		this.state = state;

		log(this);
	}

	setState(state) {
		if (this.state != state) {
			// New state
			if (state == ActiveGuild.GuildState.PLAYING) {
				// New state is playing
				setTimeout(() => {
					log(`${this.guildID}: Finished playing outro`);
					this.setState(ActiveGuild.GuildState.IDLE);
				}, idleTimeout);
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
		let guild = activeGuilds.find(
			(guild) => guild.guildID === interaction.guildID
		); // Get current guild, if it's active

		if (guild == null) {
			// Initialise guild if it isn't active
			guild = new ActiveGuild(interaction.guildID);
			activeGuilds.push(guild);
		}

		await interaction.acknowledge(); // Acknowledge the interaction

		if (guild.state != ActiveGuild.GuildState.PLAYING) { // Outro is not playing in the current guild
			// Play outro
			await interaction.createFollowup("Playing outro!");
			guild.setState(ActiveGuild.GuildState.PLAYING);
		} else if (guild.state == ActiveGuild.GuildState.PLAYING) {
			// Outro is already playing
			await interaction.createFollowup("Outro is already playing!");
		}
	},
};
