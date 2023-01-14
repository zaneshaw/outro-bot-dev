require("dotenv").config();
const { log } = require("./utils/log");
const Eris = require("eris");

const client = new Eris.Client(process.env.TOKEN, {
	intents: [],
});

client.on("connect", (id) => log(`Connected! (${id})`));

client.on("ready", async () => {
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

client.connect();
