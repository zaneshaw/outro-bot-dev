const fs = require("node:fs");
const stringify = require("json-stringify-safe");

module.exports = {
	log(message, options = { time: true, track: true }) {
		const { time, track: serialise } = options;
		const date = new Date();
		const splitDate = date.toLocaleString().split(", ");

		let timeStr = "";
		if (time) {
			const str = splitDate[1];
			timeStr = `[${str}]`;
		}

		if (serialise) {
			const name = splitDate[0].replace(/\//g, "-");
			const dir = "logs/";

			if (!fs.existsSync(dir)) {
				fs.mkdirSync(dir);
			}
			fs.appendFile(
				`${dir}${name}.txt`,
				`${timeStr} ${stringify(message)}\n`,
				(err) => {
					if (err) throw err;

					// Success
				}
			);
		}

		console.debug(timeStr, message);
	},
};
