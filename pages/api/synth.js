import { execFile } from "child_process";
import path from "path";
import os from "os";
import fs from "fs";
import crypto from "crypto";

export const config = {
	api: {
		bodyParser: {
			sizeLimit: '10mb',
		},
	},
};

export default async function handler(req, res) {
	let notes = req.body.notes;
	let fileName = req.body.fileName;
	console.log("notes:", notes);

	if (!Array.isArray(notes) || !notes.every(n => typeof n === 'number')) {
		return res.status(400).json({ error: "Invalid notes array" });
	}

	const execPath = path.join(process.cwd(), "utils", "sound");
	const execDir = os.tmpdir();
	const tmpFileName = `${crypto.randomUUID()}.wav`;
	const tmpFilePath = path.join(execDir, tmpFileName);
	console.log("running", execPath, "in:", execDir);

	let args = [tmpFileName, ...notes];
	console.log("fileName:", fileName);
	console.log("args:", args);

	execFile(execPath, args, { cwd: execDir, timeout: 10000 }, async (error, stdout, stderr) => {
		if (error) {
			console.error("Exec error:", error);
			return res.status(500).json({ error: "Failed to create audio" });
		}

		try {
			const audioBuffer = await fs.promises.readFile(tmpFilePath);
			await fs.promises.unlink(tmpFilePath);

			res.setHeader("Content-Type", "audio/wav");
			return res.status(200).send(audioBuffer);
		} catch (readError) {
			console.error("Error reading temp file:", readError);
			return res.status(500).json({ error: "Failed to read generated audio" });
		}
	});
}