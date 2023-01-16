const fs = require("node:fs");
const stringify = require("json-stringify-safe");

module.exports = {
	log(message, { log = true, time = true, serialise = true, subDir = "" } = {}) {
		const date = new Date();
		const splitDate = date.toLocaleString().split(", ");

		let timeStr = "";
		if (time) {
			const str = splitDate[1];
			timeStr = `[${str}]`;
		}

		if (serialise) {
			const name = splitDate[0].replace(/\//g, "-");
			const dir = subDir == "" ? "logs/" : `logs/${subDir}/`;
			const strMessage =
				typeof message == "string" ? message : stringify(message);

			if (!fs.existsSync(dir)) {
				fs.mkdirSync(dir);
			}
			fs.appendFile(
				`${dir}${name}.txt`,
				`${timeStr} ${strMessage}\n`,
				(err) => {
					if (err) throw err;

					// Success
				}
			);
		}

		if (log) console.debug(timeStr, message);
	},
};
