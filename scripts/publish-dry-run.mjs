import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');

function runPublishDryRun() {
	return new Promise((resolve) => {
		const child = spawn('npm', ['publish', '--dry-run', '--ignore-scripts'], {
			cwd: projectRoot,
			shell: true,
			stdio: ['inherit', 'pipe', 'pipe'],
		});

		let stderr = '';
		child.stdout.on('data', (chunk) => {
			process.stdout.write(chunk);
		});
		child.stderr.on('data', (chunk) => {
			const text = String(chunk);
			stderr += text;
			process.stderr.write(text);
		});

		child.on('close', (code) => {
			resolve({
				code: code ?? 1,
				stderr,
			});
		});
	});
}

function isAlreadyPublishedVersionError(stderr) {
	const normalized = stderr.toLowerCase();
	return (
		normalized.includes('cannot publish over the previously published versions') ||
		normalized.includes('you cannot publish over the previously published versions')
	);
}

const result = await runPublishDryRun();

if (result.code === 0) {
	process.exit(0);
}

if (isAlreadyPublishedVersionError(result.stderr)) {
	process.stdout.write(
		'Publish dry-run skipped version lock check: current version is already published on npm.\n',
	);
	process.exit(0);
}

process.exit(result.code);
