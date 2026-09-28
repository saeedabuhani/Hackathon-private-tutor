# Pushes the variables from .env.local to the linked Vercel project (production).
# Run it yourself, from the project root, AFTER `npx vercel login` and `npx vercel link`.
#   powershell -ExecutionPolicy Bypass -File scripts\vercel-env.ps1 -AppUrl https://YOUR-APP.vercel.app
param(
  [Parameter(Mandatory = $true)][string]$AppUrl
)

$names = @(
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY',
  'OPENAI_API_KEY',
  'OPENAI_MODEL',
  'YOUTUBE_API_KEY',
  'ADMIN_API_KEY',
  'NEXT_PUBLIC_APP_URL'
)

$values = @{}
Get-Content .env.local | ForEach-Object {
  if ($_ -match '^\s*([A-Z_]+)\s*=(.*)$') { $values[$matches[1]] = $matches[2].Trim() }
}
$values['NEXT_PUBLIC_APP_URL'] = $AppUrl.Trim().TrimEnd('/')

foreach ($name in $names) {
  if (-not $values[$name]) { Write-Warning "$name is empty in .env.local, skipping"; continue }
  # Remove an old value first so re-running the script is safe
  npx vercel env rm $name production --yes 2>$null | Out-Null
  # Pipe the value through stdin so it never appears in the process list
  $values[$name] | npx vercel env add $name production
  Write-Host "set $name"
}
Write-Host "Done. Redeploy with: npx vercel --prod"
