# Smoke test for Batch 3 regression
$base = 'http://localhost:3001'
$results = @()

function Test-Route($email, $password, $routes) {
  $session = New-Object Microsoft.PowerShell.Commands.WebRequestSession
  $loginUri = "$base/login"
  
  # Get CSRF
  try {
    $resp = Invoke-RestMethod -Uri "$base/api/auth/csrf" -Method Get -WebSession $session -ErrorAction Stop -UseBasicParsing
    $csrf = $resp.csrfToken
  } catch {
    return @{ email=$email; error="CSRF failed: $_" }
  }
  
  # Login
  $form = "email=$([uri]::EscapeDataString($email))&password=$([uri]::EscapeDataString($password))&csrfToken=$([uri]::EscapeDataString($csrf))&callbackUrl=$([uri]::EscapeDataString("/dashboard"))"
  try {
    $loginResp = Invoke-RestMethod -Uri "$base/api/auth/callback/credentials" -Method Post -Body $form -ContentType "application/x-www-form-urlencoded" -WebSession $session -ErrorAction Stop -UseBasicParsing
  } catch {
    return @{ email=$email; error="Login failed: $_" }
  }
  
  # Test each route
  $routeResults = @()
  foreach ($route in $routes) {
    try {
      $r = Invoke-WebRequest -Uri "$base$route" -Method Get -WebSession $session -MaximumRedirection 0 -ErrorAction Stop -UseBasicParsing -TimeoutSec 10
      $status = $r.StatusCode
      $redir = $r.Headers.Location
      $ok = ($status -eq 200) -or ($status -in @(307,302) -and ($redir -notlike "*forbidden*"))
      $routeResults += @{ route=$route; status=$status; ok=$ok; redirect=$redir }
    } catch {
      $routeResults += @{ route=$route; status=0; ok=$false; error=$_.Exception.Message }
    }
  }
  return @{ email=$email; routes=$routeResults }
}

# Test accounts (from seed output)
$accounts = @(
  @{ email='clinic@schoolos.local'; password='Welcome@2026'; role='ROLE017 Health Visitor' },
  @{ email='security@schoolos.local'; password='Welcome@2026'; role='ROLE016 Security' },
  @{ email='fatma.studentaffairs@schoolos.local'; password='Welcome@2026'; role='ROLE004 Student Affairs' },
  @{ email='hassan.social@schoolos.local'; password='Welcome@2026'; role='ROLE014 Social Specialist' },
  @{ email='esmat.hamdy@schoolos.local'; password='Welcome@2026'; role='ROLE013 Prof Trans Officer' },
  @{ email='mahmoud.aboshosha@schoolos.local'; password='Welcome@2026'; role='ROLE006 Quality' },
  @{ email='ayman.hamdoun@schoolos.local'; password='Welcome@2026'; role='ROLE002 Academic Director' }
)

# Routes to test (old + new)
$oldRoutes = @(
  '/dashboard', '/attendance/students', '/attendance/employees', '/attendance/reports',
  '/students', '/hr', '/academics', '/exams', '/exams/remedial',
  '/inventory', '/visitors', '/quality', '/quality/improvement-plans',
  '/quality/visits/schedule', '/quality/warnings', '/quality/broadcast',
  '/quality/cleanliness', '/documentation', '/activities',
  '/committees', '/reports', '/social', '/psychological',
  '/professional-transformation', '/security/gate-log', '/security/shifts',
  '/security/daily-summary', '/labs', '/workshops', '/supervision', '/trainings'
)

$newRoutes = @(
  '/clinic', '/activities/sports', '/social/meetings', '/social/protection-committee',
  '/complaints', '/governance/board', '/governance/notices', '/discipline-bylaw',
  '/contact', '/reports/daily-summary',
  '/exams/grade/1', '/exams/grade/2', '/exams/grade/3',
  '/professional-transformation/violations', '/professional-transformation/camps',
  '/professional-transformation/projects', '/professional-transformation/competitions'
)

$allRoutes = $oldRoutes + $newRoutes

Write-Host "Testing $($accounts.Count) accounts against $($allRoutes.Count) routes..."

$allResults = @()
foreach ($acc in $accounts) {
  Write-Host "Testing $($acc.email) ($($acc.role))..."
  $res = Test-Route $acc.email $acc.password $allRoutes
  $allResults += $res
  
  $passed = ($res.routes | Where-Object { $_.ok }).Count
  $failed = ($res.routes | Where-Object { -not $_.ok }).Count
  Write-Host "  Passed: $passed, Failed: $failed"
  
  if ($failed -gt 0) {
    $res.routes | Where-Object { -not $_.ok } | ForEach-Object {
      Write-Host "    FAIL: $($_.route) - Status: $($_.status) $($_.redirect) $($_.error)" -ForegroundColor Red
    }
  }
}

# Summary
Write-Host "`n=== SUMMARY ==="
$allResults | ForEach-Object {
  $p = ($_.routes | Where-Object { $_.ok }).Count
  $f = ($_.routes | Where-Object { -not $_.ok }).Count
  Write-Host "$($_.email): $p pass, $f fail"
}

# Stop server
Stop-Process -Id 32240 -Force -ErrorAction SilentlyContinue
Write-Host "Server stopped."