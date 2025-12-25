import uploadAudio from "../../utils/uploadAudio.js"

export default async function handler(req, res) {
	let fileName = req.body.fileName;
	let buffer = req.body.buffer;

	let upload = await uploadAudio(fileName, buffer);
	console.log("path:", upload);
	if (upload) {
		return res.status(200).json({path: upload});
	}
	else {
		return res.status(500).json({error: "Failed to upload audio"});
	}
}