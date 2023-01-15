require("dotenv").config();
const { log } = require("./utils/log");
const Eris = require("eris");

const client = new Eris.Client(process.env.TOKEN, {
	intents: [
		Eris.Constants.Intents.guilds,
		Eris.Constants.Intents.guildVoiceStates,
	],
});
let outroCount = 0;

client.on("connect", (id) => log(`Connected! (${id})`));

client.on("ready", async () => {
	setInterval(() => {
		const str = `${outroCount} outro${outroCount != 1 ? "s" : ""}`;
		client.editStatus({ name: str });
	}, 4000);

	log("Loading application commands...");

	await client.createGuildCommand("1022451997582045184", {
		name: "outro",
		type: Eris.Constants.ApplicationCommandTypes.CHAT_INPUT,
		description: "Plays outro!",
	});

	log("Ready!");
});

client.on("error", (err) => {
	log(err);
});

client.on("interactionCreate", (interaction) => {
	if (interaction instanceof Eris.CommandInteraction) {
		switch (interaction.data.name) {
			case "outro":
				return require("./commands/outro").run(interaction);
			default: {
				return interaction.createMessage(
					"Unhandled command! Please report."
				);
			}
		}
	}
});

module.exports = {
	async joinVoiceChannel(channelID) {
		return await client.joinVoiceChannel(channelID);
	},
	leaveVoiceChannel(channelID) {
		return client.leaveVoiceChannel(channelID);
	},
	updateOutroCount(amount) {
		outroCount = amount;
	},
};

client.connect();
