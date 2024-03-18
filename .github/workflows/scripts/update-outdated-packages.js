const { execSync } = require('child_process');

const outdatedPackages = execSync('pnpm outdated -r --json')
	.toString()
	.trim()
	.split('\n')
	.filter(Boolean)
	.map((line) => {
		const [packageName, latestVersion] = line.split(' ').slice(-2);
		return `${packageName}=${latestVersion}`;
	});

console.log(outdatedPackages.join('\n'));
