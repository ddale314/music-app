const { execFile } = require("child_process");
import path from "path";

export default async function handler(req, res) {
	let notes = req.body.notes;
	let fileName = req.body.fileName;
	console.log("notes:", notes);

	const execPath = path.join(process.cwd(), "utils", "sound");
	const execDir = path.join(process.cwd(), "public", "audio");
	console.log("running", execPath, "in:", execDir);

	let args = [fileName, ...notes];
	console.log("fileName:", fileName);
	console.log("args:", args);

	execFile(execPath, args, { cwd: execDir }, (error, stdout, stderr) => {
		if (error) {
			return res.status(500).json({error: "Failed to create audio"});
		}
		console.log(stdout);
		return res.status(200).json({success: true});
	});
}