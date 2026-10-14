import type { Track } from './types';

export const git: Track = {
  id: 'git',
  title: 'Git & Version Control',
  icon: '🌿',
  tier: 2,
  color: '#f97316',
  blurb: 'Commits, branches, merging, remotes and pull requests: how teams collaborate on code.',
  depth: 'full',
  lessons: [
    {
      id: 'git-basics',
      title: 'Commits: snapshots of your project',
      xp: 40,
      body: `
**Git** records the history of your project as a series of **commits**, each a snapshot with a message, author, timestamp and a unique **hash** (like \`a1b2c3d\`).

Files move through three areas:

{{ill:gitareas}}

~~~bash
git init                       # start a repo
git status                     # what changed?
git add main.py                # stage a file   (git add . = everything)
git commit -m "Add login form" # snapshot the staged changes
git log --oneline              # history
git diff                       # unstaged changes, line by line
git restore file.py            # discard local changes to a file
~~~

**Good commit messages** use the imperative mood and explain *why*: \`Fix crash when cart is empty\`, not \`stuff\`.

\`.gitignore\` lists files Git should never track: \`node_modules/\`, \`.env\` (secrets!), build output.
`,
      exercise: {
        kind: 'quiz',
        questions: [
          { q: 'Which command moves changes into the staging area?', options: ['git commit', 'git add', 'git push', 'git stage-all'], answer: 1 },
          { q: 'What uniquely identifies a commit?', options: ['Its message', 'Its hash', 'The date', 'The branch name'], answer: 1 },
          { q: 'Where should .env files with secrets go?', options: ['Commit them', 'In .gitignore', 'In the README', 'In the commit message'], answer: 1 },
        ],
      },
      cards: [{ front: 'Git three areas', back: 'Working directory → (git add) → staging area → (git commit) → repository' }],
    },
    {
      id: 'git-branches',
      title: 'Branches & merging',
      xp: 45,
      body: `
A **branch** is just a movable pointer to a commit. Branches let you work on a feature without disturbing \`main\`.

{{ill:gitgraph}}

~~~bash
git switch -c feature/login    # create & switch to a branch
# ...commit work...
git switch main
git merge feature/login        # bring the work into main
git branch -d feature/login    # delete the merged branch
~~~

**Merge conflicts** happen when both branches changed the same lines. Git marks them:

~~~
<<<<<<< HEAD
color = "blue"
=======
color = "green"
>>>>>>> feature/theme
~~~
Edit the file to the version you want, remove the markers, then \`git add\` + \`git commit\`.

**Rebase** (\`git rebase main\`) replays your commits on top of another branch for a linear history. ⚠️ Never rebase commits you've already shared with others.
`,
      exercise: {
        kind: 'quiz',
        questions: [
          { q: 'What is a branch in Git?', options: ['A full copy of the repo', 'A movable pointer to a commit', 'A folder', 'A remote server'], answer: 1 },
          { q: 'Create and switch to a new branch called fix:', options: ['git branch fix --go', 'git switch -c fix', 'git new fix', 'git checkout fix --create'], answer: 1 },
          { q: 'A merge conflict means…', options: ['Git crashed', 'Both branches changed the same lines', 'The branch was deleted', 'You need to push'], answer: 1 },
        ],
      },
      cards: [{ front: 'Merge vs rebase', back: 'Merge joins histories with a merge commit; rebase replays commits on top for a linear history.' }],
    },
    {
      id: 'git-remote',
      title: 'Remotes, GitHub & pull requests',
      xp: 45,
      body: `
A **remote** is a copy of the repo on a server (GitHub, GitLab, Bitbucket). \`origin\` is the default name.

~~~bash
git clone https://github.com/user/repo.git
git remote -v                  # list remotes
git push -u origin feature/x   # upload your branch
git pull                       # fetch + merge others' changes
git fetch                      # download without merging
~~~

**The team workflow (GitHub flow):**
1. Pull the latest \`main\`
2. Create a branch for your change
3. Commit in small steps, push the branch
4. Open a **pull request (PR)**: teammates review, CI runs tests
5. Address feedback, then **merge** to main → deploy

**Lifesavers:**
- \`git stash\` / \`git stash pop\`: shelve unfinished work temporarily
- \`git log --graph --oneline --all\`: visualize branches
- \`git reflog\`: find "lost" commits after a bad reset
- \`git bisect\`: binary-search the history to find which commit introduced a bug
- \`git revert <hash>\`: safely undo a commit by adding a new inverse commit
`,
      exercise: {
        kind: 'quiz',
        questions: [
          { q: 'What does `git pull` do?', options: ['Uploads commits', 'Fetches and merges remote changes', 'Deletes a branch', 'Creates a PR'], answer: 1 },
          { q: 'Temporarily shelve uncommitted changes:', options: ['git stash', 'git save', 'git hide', 'git park'], answer: 0 },
          { q: 'Safely undo a commit that is already pushed:', options: ['git reset --hard', 'git revert <hash>', 'Delete the repo', 'git rm'], answer: 1 },
          { q: 'Which tool binary-searches history to find a bug?', options: ['git blame', 'git bisect', 'git grep', 'git log'], answer: 1 },
        ],
      },
      cards: [
        { front: 'git fetch vs git pull', back: 'fetch downloads remote commits; pull = fetch + merge.' },
        { front: 'git revert', back: 'Creates a new commit that undoes a previous one. Safe for shared history.' },
      ],
    },
  ],
};
