const fs = require("fs");

export default async function uploadAudio(fileName, buffer) {
	try {
		const path = `./public/audio/${fileName}`;
		await fs.promises.writeFile(path, buffer);
		return path;
	}
	catch (err) {
		console.log("File upload failed with error: ", err);
	}
}