const { spawn } = require("child_process");

export default async function run(req, res) {
	const python = spawn("python3", ["../test.wav", ])
}