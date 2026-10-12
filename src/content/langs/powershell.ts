import { lesson, langTrack } from './helpers';

export const powershell = langTrack({
  id: 'powershell',
  title: 'PowerShell',
  icon: '🪟',
  color: '#012456',
  lang: 'powershell',
  blurb: 'Automation for Windows, Azure and cross-platform ops. Pipes objects, not text. Essential for Windows admins and blue teams.',
  fields: ['DevOps (Windows & Azure)', 'Cybersecurity', 'IT automation'],
  lessons: [
    lesson(
      'ps-basics',
      'Variables & output',
      `
~~~powershell
$name = "PowerShell"
$version = 7
$langs = @("PS", "C#")              # array
Write-Output "Hello from $name"     # double quotes expand variables
"Version $($version + 0.4)"         # subexpression $( )
$name.Length
$name.ToUpper()
~~~

PowerShell is built on .NET, so every value is a **.NET object** with properties and methods. Commands are named **Verb-Noun**: \`Get-Process\`, \`Set-Location\`, \`New-Item\`.

> Works in Windows PowerShell 5.1 and PowerShell 7 (Windows, Linux, macOS).
`,
      {
        prompt: 'Set `$server = "web01"` and `$cpu = 73`. Output `web01 CPU: 73%`, then the server name in upper case, then `True` if `$cpu` is greater than 70.',
        starter: '# your code\n',
        solution: '$server = "web01"\n$cpu = 73\nWrite-Output "$server CPU: $cpu%"\nWrite-Output $server.ToUpper()\nWrite-Output ($cpu -gt 70)\n',
        expected: 'web01 CPU: 73%\nWEB01\nTrue',
        hints: ['Write-Output "$server CPU: $cpu%"', 'Comparison operators are words: -gt, -lt, -eq, -ne.'],
      },
      [['PowerShell comparison operators', '-eq -ne -gt -ge -lt -le -like -match (not ==, >, <).']],
    ),
    lesson(
      'ps-pipeline',
      'The object pipeline',
      `
PowerShell pipes **objects**, so you filter on properties instead of parsing text:

~~~powershell
Get-Process | Where-Object CPU -gt 100 | Sort-Object CPU -Descending | Select-Object -First 5 Name, CPU
Get-ChildItem *.log | Measure-Object Length -Sum
1..10 | Where-Object { $_ % 2 -eq 0 } | ForEach-Object { $_ * $_ }   # $_ = current item
~~~

Aliases exist for interactive use (\`ls\`, \`?\`, \`%\`), but write full names in scripts for readability.
`,
      {
        prompt: 'Pipe `1..20` through `Where-Object` to keep multiples of 3, square them with `ForEach-Object`, and output their sum using `Measure-Object -Sum` (print just the number).',
        starter: '# your pipeline\n',
        solution: '$sum = 1..20 | Where-Object { $_ % 3 -eq 0 } | ForEach-Object { $_ * $_ } | Measure-Object -Sum\nWrite-Output $sum.Sum\n',
        expected: '819',
        hints: ['Where-Object { $_ % 3 -eq 0 }', '(… | Measure-Object -Sum).Sum gives the number.'],
      },
      [['$_ in PowerShell', 'The current pipeline object inside script blocks like Where-Object { $_.Name -like "a*" }.']],
    ),
    lesson(
      'ps-objects',
      'Custom objects & hashtables',
      `
~~~powershell
$user = @{ Name = "Ada"; Role = "admin" }          # hashtable
$user["Team"] = "core"

$servers = @(
  [PSCustomObject]@{ Name = "web01"; Cpu = 73; Env = "prod" }
  [PSCustomObject]@{ Name = "web02"; Cpu = 12; Env = "prod" }
)
$servers | Where-Object Env -eq "prod" | Sort-Object Cpu -Descending
$servers | Group-Object Env | ForEach-Object { "$($_.Name): $($_.Count)" }
~~~

\`[PSCustomObject]\` turns a hashtable into a real object: perfect for reports and \`Export-Csv\`/\`ConvertTo-Json\`.
`,
      {
        prompt: 'From the `$servers` objects, output the names of servers with `Cpu` above 50 sorted by Cpu descending (one per line), then the average Cpu of all servers rounded to 1 decimal.',
        starter: '$servers = @(\n  [PSCustomObject]@{ Name = "web01"; Cpu = 73 }\n  [PSCustomObject]@{ Name = "db01"; Cpu = 91 }\n  [PSCustomObject]@{ Name = "cache01"; Cpu = 12 }\n  [PSCustomObject]@{ Name = "web02"; Cpu = 55 }\n)\n# your code\n',
        solution: '$servers = @(\n  [PSCustomObject]@{ Name = "web01"; Cpu = 73 }\n  [PSCustomObject]@{ Name = "db01"; Cpu = 91 }\n  [PSCustomObject]@{ Name = "cache01"; Cpu = 12 }\n  [PSCustomObject]@{ Name = "web02"; Cpu = 55 }\n)\n$servers | Where-Object Cpu -gt 50 | Sort-Object Cpu -Descending | ForEach-Object { $_.Name }\n$avg = ($servers | Measure-Object Cpu -Average).Average\nWrite-Output ([math]::Round($avg, 1))\n',
        expected: 'db01\nweb01\nweb02\n57.8',
        hints: ['Where-Object Cpu -gt 50 | Sort-Object Cpu -Descending | ForEach-Object { $_.Name }', '([math]::Round(($servers | Measure-Object Cpu -Average).Average, 1))'],
      },
      [['PSCustomObject', '[PSCustomObject]@{ Key = value } creates an object with properties: ideal for structured output.']],
    ),
    lesson(
      'ps-functions',
      'Functions & parameters',
      `
~~~powershell
function Get-Greeting {
    param(
        [Parameter(Mandatory)] [string]$Name,
        [int]$Times = 1
    )
    for ($i = 0; $i -lt $Times; $i++) { "Hello, $Name" }   # anything not captured is output
}
Get-Greeting -Name Ada -Times 2

function Test-Port([int]$Port) { $Port -ge 1 -and $Port -le 65535 }
~~~

Everything a function doesn't capture is **returned to the pipeline**, so use \`$null = …\` or \`[void]\` to discard values you don't want to output.
`,
      {
        prompt: 'Write `function Convert-Size([long]$Bytes)` returning a string like `1.5 KB`, `20.0 MB` or `512 B` (1024-based units, one decimal for KB/MB/GB). Output it for 512, 1536, 20971520 and 5368709120.',
        starter: 'function Convert-Size([long]$Bytes) {\n    ""\n}\n\nforeach ($b in 512, 1536, 20971520, 5368709120) {\n    Convert-Size $b\n}\n',
        solution: 'function Convert-Size([long]$Bytes) {\n    if ($Bytes -lt 1KB) { return "$Bytes B" }\n    foreach ($unit in "GB", "MB", "KB") {\n        $size = Invoke-Expression "1$unit"\n        if ($Bytes -ge $size) {\n            return "{0:N1} {1}" -f ($Bytes / $size), $unit\n        }\n    }\n}\n\nforeach ($b in 512, 1536, 20971520, 5368709120) {\n    Convert-Size $b\n}\n',
        expected: '512 B\n1.5 KB\n20.0 MB\n5.0 GB',
        hints: ['PowerShell understands 1KB, 1MB, 1GB literals.', '"{0:N1} {1}" -f $value, $unit formats with one decimal.'],
      },
      [['PowerShell -f operator', '"{0} is {1:N2}" -f $a, $b: .NET string formatting.']],
    ),
    lesson(
      'ps-errors',
      'Error handling & JSON',
      `
~~~powershell
try {
    $n = [int]"abc"                      # throws a conversion error
}
catch {
    Write-Output "Failed: $($_.Exception.Message)"
}
finally { Write-Output "cleanup" }

$config = '{"name":"api","replicas":3}' | ConvertFrom-Json
$config.replicas
@{ status = "ok"; count = 2 } | ConvertTo-Json -Compress
~~~

Use \`-ErrorAction Stop\` so a command's non-terminating errors become catchable exceptions.
`,
      {
        prompt: 'Parse the JSON array of deployments, then output `api: ok`, `web: FAILED` style lines (status `failed` → `FAILED`). Finally output a compact JSON object `{"failed":1,"total":3}` (keys in that order, use an ordered hashtable `[ordered]@{}`).',
        starter: '$json = \'[{"app":"api","status":"ok"},{"app":"web","status":"failed"},{"app":"worker","status":"ok"}]\'\n# your code\n',
        solution: '$json = \'[{"app":"api","status":"ok"},{"app":"web","status":"failed"},{"app":"worker","status":"ok"}]\'\n$deploys = $json | ConvertFrom-Json\nforeach ($d in $deploys) {\n    $label = if ($d.status -eq "failed") { "FAILED" } else { $d.status }\n    Write-Output "$($d.app): $label"\n}\n$failed = @($deploys | Where-Object status -eq "failed").Count\n[ordered]@{ failed = $failed; total = @($deploys).Count } | ConvertTo-Json -Compress\n',
        expected: 'api: ok\nweb: FAILED\nworker: ok\n{"failed":1,"total":3}',
        hints: ['$deploys = $json | ConvertFrom-Json', '[ordered]@{ failed = $failed; total = @($deploys).Count } | ConvertTo-Json -Compress'],
      },
      [['-ErrorAction Stop', 'Turns non-terminating command errors into exceptions that try/catch can handle.']],
    ),
    lesson(
      'ps-project',
      '🛠️ Mini project: Security log audit',
      `
Blue teams use PowerShell to sift through event logs. Here the events are simulated objects so the script runs anywhere.
`,
      {
        prompt: 'Group the failed logins (`Result -eq "fail"`) by user. Output users with 3 or more failures as `ALERT bob: 4 failures`, sorted by count descending. Then output `total failures: 6`.',
        starter: '$events = @(\n  [PSCustomObject]@{ User = "bob"; Result = "fail" }\n  [PSCustomObject]@{ User = "ada"; Result = "ok" }\n  [PSCustomObject]@{ User = "bob"; Result = "fail" }\n  [PSCustomObject]@{ User = "eve"; Result = "fail" }\n  [PSCustomObject]@{ User = "bob"; Result = "fail" }\n  [PSCustomObject]@{ User = "bob"; Result = "fail" }\n  [PSCustomObject]@{ User = "eve"; Result = "fail" }\n)\n# your code\n',
        solution: '$events = @(\n  [PSCustomObject]@{ User = "bob"; Result = "fail" }\n  [PSCustomObject]@{ User = "ada"; Result = "ok" }\n  [PSCustomObject]@{ User = "bob"; Result = "fail" }\n  [PSCustomObject]@{ User = "eve"; Result = "fail" }\n  [PSCustomObject]@{ User = "bob"; Result = "fail" }\n  [PSCustomObject]@{ User = "bob"; Result = "fail" }\n  [PSCustomObject]@{ User = "eve"; Result = "fail" }\n)\n$failures = $events | Where-Object Result -eq "fail"\n$failures | Group-Object User | Where-Object Count -ge 3 | Sort-Object Count -Descending | ForEach-Object {\n    "ALERT $($_.Name): $($_.Count) failures"\n}\nWrite-Output "total failures: $(@($failures).Count)"\n',
        expected: 'ALERT bob: 4 failures\ntotal failures: 6',
        hints: ['$events | Where-Object Result -eq "fail" | Group-Object User', 'Group objects have .Name and .Count.'],
      },
      [],
      80,
    ),
  ],
});
