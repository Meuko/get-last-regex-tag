import * as core from '@actions/core'
import * as github from '@actions/github'

async function run(): Promise<void> {
  try {
		// Set up Github tokens
    const gitToken: string = core.getInput('github-token')
		const git = github.getOctokit(gitToken)

		// Set up tag target.
		const regexp: string = core.getInput('tag-target')
		if (regexp != "staging" && regexp != "production") {
			return core.setFailed('Ensure that tag-target is set to either staging or production.')
		}

		// Get source context
		const { owner, repo } = github.context.repo

		var rexp = (regexp == "staging")
			? new RegExp(/^v[0-9]+\.[0-9]+\.[0-9]+\-rc(\.[0-9]+)?$/) 
			: new RegExp(/^v[0-9]+\.[0-9]+\.[0-9]+$/)	
	
			// Get all our releases
			var baseError = 'Something went wrong while trying to retrieve your releases.'
			var res = await git.request('GET  /repos/{owner}/{repo}/releases', {owner, repo})

			// Check if our request was a success
			if (res.status != 200) {
				return core.setFailed(`${baseError} Got status ${res.status} but expected status 200.`)
			}

			if (res.data.length == 0) {
				return core.setFailed(`${baseError} Response contained no data. Ensure there are releases.`)
			}
			

		// Extract all releases
		var releaseTagNames = []
		for (var value of res.data) {
			releaseTagNames.push(value.tag_name)
		}

		
		// Since our tags are ordered, simply loop and exit at first match
		var matchTag
		for (var value of releaseTagNames) {
			var matchTotal = rexp.exec(value)
			if (!matchTotal || matchTotal.length == 0) {
				continue
			} else {
				matchTag = matchTotal
				break;
			}
		}

		// At this point we have either a match or matchTag == undefined
		if (!matchTag) {
			matchTag = 'v0.0.0'
		} else {
			matchTag = matchTag[0] // if we have a match we're dealing with an array of results
		}

		core.setOutput('TARGET_TAG', matchTag)


  } catch (error) {
    if (error instanceof Error) {
			core.setFailed(error.message);
		} else {
			core.setFailed('Something went wrong.')
		}
  }
}

run()
