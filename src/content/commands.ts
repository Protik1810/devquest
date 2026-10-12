/** Cross-platform command reference used by the Command Atlas page. */
export type Cmd = {
  task: string;
  linux: string;
  mac?: string; // only when it differs from Linux
  ps: string; // PowerShell
  cmd: string; // Windows cmd.exe
  note?: string;
};

export type CmdCategory = { name: string; emoji: string; cmds: Cmd[] };

export const COMMANDS: CmdCategory[] = [
  {
    name: 'Navigation',
    emoji: '🧭',
    cmds: [
      { task: 'Show current directory', linux: 'pwd', ps: 'Get-Location  (pwd)', cmd: 'cd' },
      { task: 'List files', linux: 'ls', ps: 'Get-ChildItem  (ls, dir)', cmd: 'dir' },
      { task: 'List with details & hidden', linux: 'ls -la', ps: 'Get-ChildItem -Force', cmd: 'dir /a' },
      { task: 'Change directory', linux: 'cd path', ps: 'Set-Location path  (cd)', cmd: 'cd path' },
      { task: 'Go to home directory', linux: 'cd ~', ps: 'cd ~', cmd: 'cd %USERPROFILE%' },
      { task: 'Go up one level', linux: 'cd ..', ps: 'cd ..', cmd: 'cd ..' },
      { task: 'Show directory tree', linux: 'tree', mac: 'tree (brew install tree)', ps: 'tree /f', cmd: 'tree /f' },
      { task: 'Clear the screen', linux: 'clear  (Ctrl+L)', ps: 'Clear-Host  (cls)', cmd: 'cls' },
    ],
  },
  {
    name: 'Files & folders',
    emoji: '📁',
    cmds: [
      { task: 'Create directory', linux: 'mkdir -p a/b', ps: 'New-Item -ItemType Directory a\\b  (mkdir)', cmd: 'mkdir a\\b' },
      { task: 'Create empty file', linux: 'touch file.txt', ps: 'New-Item file.txt', cmd: 'type nul > file.txt' },
      { task: 'Copy file', linux: 'cp src dest', ps: 'Copy-Item src dest  (cp)', cmd: 'copy src dest' },
      { task: 'Copy folder', linux: 'cp -r src dest', ps: 'Copy-Item src dest -Recurse', cmd: 'xcopy src dest /e /i  or  robocopy src dest /e' },
      { task: 'Move / rename', linux: 'mv old new', ps: 'Move-Item old new  (mv) / Rename-Item', cmd: 'move old new / ren old new' },
      { task: 'Delete file', linux: 'rm file', ps: 'Remove-Item file  (rm)', cmd: 'del file' },
      { task: 'Delete folder recursively', linux: 'rm -r dir', ps: 'Remove-Item dir -Recurse', cmd: 'rmdir /s dir', note: '⚠️ No recycle bin!' },
      { task: 'Create symbolic link', linux: 'ln -s target link', ps: 'New-Item -ItemType SymbolicLink -Path link -Target target', cmd: 'mklink link target' },
      { task: 'File details', linux: 'stat file', mac: 'stat -x file', ps: 'Get-Item file | Format-List *', cmd: 'dir file' },
    ],
  },
  {
    name: 'Viewing & editing text',
    emoji: '📄',
    cmds: [
      { task: 'Print file', linux: 'cat file', ps: 'Get-Content file  (cat, type)', cmd: 'type file' },
      { task: 'Page through a file', linux: 'less file', ps: 'Get-Content file | more', cmd: 'more file' },
      { task: 'First N lines', linux: 'head -n 10 file', ps: 'Get-Content file -Head 10', cmd: '—' },
      { task: 'Last N lines', linux: 'tail -n 10 file', ps: 'Get-Content file -Tail 10', cmd: '—' },
      { task: 'Follow a growing log', linux: 'tail -f app.log', ps: 'Get-Content app.log -Wait -Tail 10', cmd: '—' },
      { task: 'Count lines', linux: 'wc -l file', ps: '(Get-Content file).Count', cmd: 'find /c /v "" file' },
      { task: 'Write text to file', linux: 'echo "hi" > f.txt', ps: 'Set-Content f.txt "hi"  or  "hi" > f.txt', cmd: 'echo hi > f.txt' },
      { task: 'Append to file', linux: 'echo "hi" >> f.txt', ps: 'Add-Content f.txt "hi"', cmd: 'echo hi >> f.txt' },
      { task: 'Terminal text editor', linux: 'nano file  /  vim file', ps: 'notepad file  /  code file', cmd: 'notepad file' },
      { task: 'Compare two files', linux: 'diff a b', ps: 'Compare-Object (gc a) (gc b)', cmd: 'fc a b' },
      { task: 'Sort lines', linux: 'sort file', ps: 'Get-Content file | Sort-Object', cmd: 'sort file' },
      { task: 'Unique lines', linux: 'sort file | uniq', ps: 'Get-Content file | Sort-Object -Unique', cmd: '—' },
    ],
  },
  {
    name: 'Searching',
    emoji: '🔎',
    cmds: [
      { task: 'Search text in a file', linux: 'grep "pat" file', ps: 'Select-String "pat" file  (sls)', cmd: 'findstr "pat" file' },
      { task: 'Search recursively', linux: 'grep -rn "pat" .', ps: 'Get-ChildItem -Recurse | Select-String "pat"', cmd: 'findstr /s /n "pat" *' },
      { task: 'Case-insensitive search', linux: 'grep -i "pat" file', ps: 'Select-String "pat" file  (insensitive by default)', cmd: 'findstr /i "pat" file' },
      { task: 'Find files by name', linux: 'find . -name "*.py"', ps: 'Get-ChildItem -Recurse -Filter *.py', cmd: 'dir /s /b *.py' },
      { task: 'Find large files', linux: 'find . -size +100M', ps: 'gci -Recurse | ? Length -gt 100MB', cmd: 'forfiles /s /c "cmd /c if @fsize gtr 104857600 echo @path"' },
      { task: 'Locate a program', linux: 'which python', ps: 'Get-Command python', cmd: 'where python' },
    ],
  },
  {
    name: 'Processes',
    emoji: '⚙️',
    cmds: [
      { task: 'List processes', linux: 'ps aux', ps: 'Get-Process  (ps)', cmd: 'tasklist' },
      { task: 'Live resource monitor', linux: 'top  /  htop', ps: 'Task Manager (Ctrl+Shift+Esc)', cmd: 'taskmgr' },
      { task: 'Kill by PID', linux: 'kill 1234  (-9 to force)', ps: 'Stop-Process -Id 1234', cmd: 'taskkill /pid 1234 /f' },
      { task: 'Kill by name', linux: 'pkill node', ps: 'Stop-Process -Name node', cmd: 'taskkill /im node.exe /f' },
      { task: 'Run in background', linux: 'cmd &', ps: 'Start-Job { cmd }', cmd: 'start /b cmd' },
      { task: 'Which process uses a port', linux: 'lsof -i :3000  /  ss -ltnp', ps: 'Get-NetTCPConnection -LocalPort 3000', cmd: 'netstat -ano | findstr :3000' },
      { task: 'Services', linux: 'systemctl status nginx', mac: 'brew services list / launchctl list', ps: 'Get-Service', cmd: 'sc query' },
    ],
  },
  {
    name: 'Networking',
    emoji: '🌐',
    cmds: [
      { task: 'Show IP addresses', linux: 'ip a', mac: 'ifconfig', ps: 'Get-NetIPAddress', cmd: 'ipconfig' },
      { task: 'Test connectivity', linux: 'ping host', ps: 'Test-Connection host', cmd: 'ping host' },
      { task: 'Trace route', linux: 'traceroute host', ps: 'Test-NetConnection host -TraceRoute', cmd: 'tracert host' },
      { task: 'DNS lookup', linux: 'dig host  /  nslookup host', ps: 'Resolve-DnsName host', cmd: 'nslookup host' },
      { task: 'HTTP request', linux: 'curl https://example.com', ps: 'Invoke-WebRequest url  (iwr)  or  curl.exe url', cmd: 'curl url' },
      { task: 'Download a file', linux: 'curl -O url  /  wget url', ps: 'Invoke-WebRequest url -OutFile f', cmd: 'curl -o f url' },
      { task: 'Test a TCP port', linux: 'nc -zv host 443', ps: 'Test-NetConnection host -Port 443', cmd: '—' },
      { task: 'Remote shell', linux: 'ssh user@host', ps: 'ssh user@host', cmd: 'ssh user@host' },
      { task: 'Copy over SSH', linux: 'scp f user@host:/path  /  rsync -av', ps: 'scp f user@host:/path', cmd: 'scp f user@host:/path' },
    ],
  },
  {
    name: 'System & disk',
    emoji: '💽',
    cmds: [
      { task: 'OS / kernel info', linux: 'uname -a  /  cat /etc/os-release', mac: 'sw_vers', ps: 'Get-ComputerInfo', cmd: 'systeminfo' },
      { task: 'Disk free space', linux: 'df -h', ps: 'Get-PSDrive -PSProvider FileSystem', cmd: 'wmic logicaldisk get size,freespace' },
      { task: 'Folder size', linux: 'du -sh dir', ps: '(gci dir -Recurse | Measure-Object Length -Sum).Sum', cmd: 'dir /s dir' },
      { task: 'Memory usage', linux: 'free -h', mac: 'vm_stat', ps: 'Get-CimInstance Win32_OperatingSystem', cmd: 'systeminfo | find "Memory"' },
      { task: 'Current user', linux: 'whoami', ps: 'whoami  /  $env:USERNAME', cmd: 'whoami' },
      { task: 'Uptime', linux: 'uptime', ps: '(Get-Date) - (gcim Win32_OperatingSystem).LastBootUpTime', cmd: 'systeminfo | find "Boot Time"' },
      { task: 'Shutdown / restart', linux: 'sudo shutdown now / sudo reboot', ps: 'Stop-Computer / Restart-Computer', cmd: 'shutdown /s /t 0  /  shutdown /r' },
      { task: 'Command history', linux: 'history  (Ctrl+R to search)', ps: 'Get-History  (F8 / Ctrl+R)', cmd: 'doskey /history  (F7)' },
    ],
  },
  {
    name: 'Users & permissions',
    emoji: '🔐',
    cmds: [
      { task: 'Run as administrator', linux: 'sudo cmd', ps: 'Start-Process pwsh -Verb RunAs', cmd: 'runas /user:Administrator cmd' },
      { task: 'Change permissions', linux: 'chmod 755 file', ps: 'icacls file /grant user:F', cmd: 'icacls file /grant user:F' },
      { task: 'Make script executable', linux: 'chmod +x script.sh', ps: 'Set-ExecutionPolicy -Scope CurrentUser RemoteSigned', cmd: '—', note: 'Windows uses execution policy, not +x' },
      { task: 'Change owner', linux: 'sudo chown user:group file', ps: 'Set-Acl', cmd: 'takeown /f file' },
      { task: 'Add user', linux: 'sudo adduser name', mac: 'sysadminctl -addUser name', ps: 'New-LocalUser name', cmd: 'net user name /add' },
    ],
  },
  {
    name: 'Environment & shell',
    emoji: '🧪',
    cmds: [
      { task: 'Print a variable', linux: 'echo $HOME', ps: '$env:USERPROFILE', cmd: 'echo %USERPROFILE%' },
      { task: 'Set variable (session)', linux: 'export KEY=value', ps: '$env:KEY = "value"', cmd: 'set KEY=value' },
      { task: 'Set variable (permanent)', linux: 'add export to ~/.bashrc', mac: 'add export to ~/.zshrc', ps: '[Environment]::SetEnvironmentVariable("KEY","v","User")', cmd: 'setx KEY value' },
      { task: 'List all variables', linux: 'env', ps: 'Get-ChildItem env:', cmd: 'set' },
      { task: 'Show PATH', linux: 'echo $PATH', ps: '$env:PATH -split ";"', cmd: 'echo %PATH%' },
      { task: 'Create alias', linux: "alias ll='ls -la'", ps: 'Set-Alias ll Get-ChildItem', cmd: 'doskey ll=dir $*' },
      { task: 'Run if previous succeeded', linux: 'cmd1 && cmd2', ps: 'cmd1; if ($?) { cmd2 }  (pwsh 7: &&)', cmd: 'cmd1 && cmd2' },
      { task: 'Last exit code', linux: 'echo $?', ps: '$LASTEXITCODE  /  $?', cmd: 'echo %ERRORLEVEL%' },
    ],
  },
  {
    name: 'Archives & packages',
    emoji: '📦',
    cmds: [
      { task: 'Zip', linux: 'zip -r out.zip dir', ps: 'Compress-Archive dir out.zip', cmd: 'tar -a -cf out.zip dir' },
      { task: 'Unzip', linux: 'unzip f.zip', ps: 'Expand-Archive f.zip dest', cmd: 'tar -xf f.zip' },
      { task: 'tar.gz create / extract', linux: 'tar -czf a.tgz dir  /  tar -xzf a.tgz', ps: 'tar -czf a.tgz dir', cmd: 'tar -xzf a.tgz' },
      { task: 'Install a package', linux: 'sudo apt install x  (Debian/Ubuntu)  ·  dnf (Fedora)  ·  pacman -S (Arch)', mac: 'brew install x', ps: 'winget install x', cmd: 'winget install x' },
      { task: 'Update all packages', linux: 'sudo apt update && sudo apt upgrade', mac: 'brew upgrade', ps: 'winget upgrade --all', cmd: 'winget upgrade --all' },
    ],
  },
  {
    name: 'Git (same everywhere)',
    emoji: '🌿',
    cmds: [
      { task: 'Clone a repo', linux: 'git clone URL', ps: 'git clone URL', cmd: 'git clone URL' },
      { task: 'Status / diff', linux: 'git status · git diff', ps: 'same', cmd: 'same' },
      { task: 'Stage & commit', linux: 'git add . && git commit -m "msg"', ps: 'same', cmd: 'same' },
      { task: 'New branch', linux: 'git switch -c name', ps: 'same', cmd: 'same' },
      { task: 'Push / pull', linux: 'git push · git pull', ps: 'same', cmd: 'same' },
      { task: 'Pretty log', linux: 'git log --oneline --graph --all', ps: 'same', cmd: 'same' },
      { task: 'Stash work', linux: 'git stash · git stash pop', ps: 'same', cmd: 'same' },
      { task: 'Undo a pushed commit', linux: 'git revert <hash>', ps: 'same', cmd: 'same' },
    ],
  },
  {
    name: 'Docker (same everywhere)',
    emoji: '🐳',
    cmds: [
      { task: 'Build image', linux: 'docker build -t app .', ps: 'same', cmd: 'same' },
      { task: 'Run container', linux: 'docker run -p 8080:80 app', ps: 'same', cmd: 'same' },
      { task: 'List containers', linux: 'docker ps -a', ps: 'same', cmd: 'same' },
      { task: 'Shell into container', linux: 'docker exec -it <id> sh', ps: 'same', cmd: 'same' },
      { task: 'Logs', linux: 'docker logs -f <id>', ps: 'same', cmd: 'same' },
      { task: 'Compose up / down', linux: 'docker compose up -d · docker compose down', ps: 'same', cmd: 'same' },
      { task: 'Clean up unused', linux: 'docker system prune', ps: 'same', cmd: 'same' },
    ],
  },
];
