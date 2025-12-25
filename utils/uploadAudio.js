const fs = require("fs");

export default async function uploadAudio(fileName, buffer) {
	try {
		const filePath = `./public/audio/${fileName}.wav`;
		const audioBuffer = Buffer.from(buffer, "base64");
		await fs.promises.writeFile(filePath, audioBuffer);
		return filePath;
	}
	catch (err) {
		console.log("File upload failed with error: ", err);
	}
}
