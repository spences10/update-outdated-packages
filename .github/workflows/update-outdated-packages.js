import npmCheckUpdates from 'npm-check-updates';
import * as octokit from '@octokit/rest';
import * as fs from 'fs';

async function main() {
	// Run npm-check-updates to find outdated packages
	const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
	const outdatedPackages = await npmCheckUpdates({
		packageFile: 'package.json',
		json: true
	});

	// Loop through outdated packages and create PRs for both devDependencies and normal dependencies
	for (const [packageName, packageInfo] of Object.entries(outdatedPackages)) {
		// Create a GitHub client
		const github = new octokit.Octokit({
			auth: process.env.GITHUB_TOKEN
		});

		// Create a new branch with the updated package version
		const branchName = `update-${packageName}-to-${packageInfo.current}`;
		await github.rest.repos.createBranch({
			owner: 'your-github-username',
			repo: 'your-repo-name',
			ref: `heads/${branchName}`,
			sha: process.env.GITHUB_SHA
		});

		// Update the package.json file in the new branch
		let packageType = 'dependencies';
		if (packageJson.devDependencies[packageName]) {
			packageType = 'devDependencies';
		}
		const updatedPackageJson = {
			...packageJson,
			[packageType]: {
				...packageJson[packageType],
				[packageName]: packageInfo.current
			}
		};
		await github.rest.repos.createOrUpdateFile({
			owner: 'your-github-username',
			repo: 'your-repo-name',
			path: 'package.json',
			message: `Update ${packageName} to ${packageInfo.current}`,
			branch: branchName,
			content: Buffer.from(JSON.stringify(updatedPackageJson, null, 2)).toString('base64'),
			sha: packageJsonSha
		});

		// Create a pull request for the updated package
		const pullRequest = await github.rest.pulls.create({
			owner: 'your-github-username',
			repo: 'your-repo-name',
			head: branchName,
			base: 'main', // or whatever your default branch is called
			title: `Update ${packageName} to ${packageInfo.current}`,
			body: `This pull request updates ${packageName} to version ${packageInfo.current}.`
		});

		console.log(`Created pull request #${pullRequest.data.number} for ${packageName}`);
	}
}

main().catch((error) => {
	console.error(error);
	process.exitCode = 1;
});
