import uploadAudio from "../../utils/uploadAudio.js"

export const config = {
	api: {
		bodyParser: {
			sizeLimit: '50mb',
		},
	},
};

export default async function handler(req, res) {
	let fileName = req.body.fileName;
	let buffer = req.body.buffer;

	console.log(buffer.size);
	let upload = await uploadAudio(fileName, buffer);
	console.log("path:", upload);
	if (upload) {
		return res.status(200).json({path: upload});
	}
	else {
		return res.status(500).json({error: "Failed to upload audio"});
	}
}