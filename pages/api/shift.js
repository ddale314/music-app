const { spawn } = require("child_process");
const fs = require("fs");

export default async function handler(req, res) {
	let factor = req.body.factor;
	let type = req.body.type;
	let filePath = req.body.filePath;

	let python;
	if (type == "shift") {
		python = spawn("python3", ["timeShift.py", "--shift", filePath, factor]);
	}
	else {
		python = spawn("python3", ["timeShift.py", filePath, factor]);
	}
	
	python.stdout.on("data", (data) => {
		console.log(`response: ${data}`);
	});

	python.stderr.on("data", (data) => {
		console.error(`stderr: ${data}`);
	});

	python.on("close", (code) => {
		console.log(`exited with code ${code}`);
		return res.status(200).json({message: "worked"});
	});
}