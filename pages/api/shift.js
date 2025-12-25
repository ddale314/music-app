const { spawn } = require("child_process");

export default async function handler(req, res) {
	let factor = req.body.factor;
	let type = req.body.type;

	let python;
	let file = "test_2.wav";
	if (type == "shift") {
		python = spawn("python3", ["timeShift.py", "--shift", file, factor]);
	}
	else {
		python = spawn("python3", ["timeShift.py", file, factor]);
	}
	
	python.stdout.on("data", (data) => {
		console.log(`response: ${data}`);
	});

	python.stderr.on("data", (data) => {
		console.error(`stderr: ${data}`);
	});

	python.on("close", (code) => {
		console.log(`exited with code ${code}`);
		return res.status(200).json({message: "worked", data: req.body});
	});
}