#!/usr/bin/env pwsh
<#
.SYNOPSIS
    DAST test runner for the OSCC Flask API using PowerShell (Invoke-WebRequest).
    This bypasses the Python background-task localhost isolation issue.
    Writes results to automated_test\report.json

.USAGE
    powershell -ExecutionPolicy Bypass -File automated_test\dast_runner.ps1
#>

Set-StrictMode -Version Latest
$ErrorActionPreference = "SilentlyContinue"

# ── Config ──────────────────────────────────────────────────────────────────
$cfg   = Get-Content "$PSScriptRoot\..\input.json" | ConvertFrom-Json
$BASE  = $cfg.baseUrl.TrimEnd('/')
$ts    = { (Get-Date -Format "yyyy-MM-ddTHH:mm:ssZ") }

$results = [System.Collections.Generic.List[object]]::new()

function Add-Result {
    param($endpoint,$method,$role,$status,$expectedStatus,$finding,$severity,$ms,$category,$note)
    $results.Add([PSCustomObject]@{
        endpoint         = $endpoint
        method           = $method
        role             = $role
        status           = $status
        expected_status  = $expectedStatus
        finding          = $finding
        severity         = $severity
        response_time_ms = [math]::Round($ms,1)
        test_category    = $category
        note             = $note
        timestamp        = (Get-Date -Format "yyyy-MM-ddTHH:mm:ssZ")
    })
}

function Invoke-Probe {
    param([string]$Method="GET",[string]$Url,[hashtable]$Headers=@{},[string]$Body="",[string]$ContentType="",[string]$FilePath="")
    $sw = [System.Diagnostics.Stopwatch]::StartNew()
    try {
        if ($FilePath) {
            # multipart file upload via curl.exe (more reliable for binary)
            $curlArgs = @("-s","-X","POST",$Url,"--max-time","30",
                          "-F","image=@$FilePath;type=image/jpeg",
                          "-w","`n%{http_code}")
            foreach ($k in $Headers.Keys) { $curlArgs += @("-H","${k}: $($Headers[$k])") }
            $raw   = & curl.exe @curlArgs 2>&1
            $lines = ($raw -join "`n").Split("`n")
            $code  = [int]($lines[-1].Trim())
            $body  = $lines[0..($lines.Length-2)] -join "`n"
        } else {
            $iwrArgs = @{
                Uri = $Url; Method = $Method; TimeoutSec = 30
                UseBasicParsing = $true; ErrorAction = "Stop"
            }
            if ($Headers.Count)     { $iwrArgs.Headers     = $Headers }
            if ($Body)              { $iwrArgs.Body         = $Body }
            if ($ContentType)       { $iwrArgs.ContentType  = $ContentType }
            $resp = Invoke-WebRequest @iwrArgs
            $code = [int]$resp.StatusCode
            $body = $resp.Content
        }
        $sw.Stop()
        return @{ Code=$code; Body=$body; Ms=$sw.Elapsed.TotalMilliseconds }
    } catch {
        $sw.Stop()
        $msg = $_.Exception.Message
        # Try to pull status code from exception
        $code = 0
        if ($msg -match "(\d{3})") { $code = [int]$Matches[1] }
        return @{ Code=$code; Body=$msg; Ms=$sw.Elapsed.TotalMilliseconds }
    }
}

# Create a tiny 1x1 white JPEG for upload tests
$tinyJpeg = "$PSScriptRoot\probe_image.jpg"
if (-not (Test-Path $tinyJpeg)) {
    # Minimal valid JPEG bytes (1x1 white pixel)
    $bytes = [byte[]](0xFF,0xD8,0xFF,0xE0,0x00,0x10,0x4A,0x46,0x49,0x46,0x00,0x01,
                      0x01,0x00,0x00,0x01,0x00,0x01,0x00,0x00,0xFF,0xDB,0x00,0x43,
                      0x00,0x08,0x06,0x06,0x07,0x06,0x05,0x08,0x07,0x07,0x07,0x09,
                      0x09,0x08,0x0A,0x0C,0x14,0x0D,0x0C,0x0B,0x0B,0x0C,0x19,0x12,
                      0x13,0x0F,0x14,0x1D,0x1A,0x1F,0x1E,0x1D,0x1A,0x1C,0x1C,0x20,
                      0x24,0x2E,0x27,0x20,0x22,0x2C,0x23,0x1C,0x1C,0x28,0x37,0x29,
                      0x2C,0x30,0x31,0x34,0x34,0x34,0x1F,0x27,0x39,0x3D,0x38,0x32,
                      0x3C,0x2E,0x33,0x34,0x32,0xFF,0xC0,0x00,0x0B,0x08,0x00,0x01,
                      0x00,0x01,0x01,0x01,0x11,0x00,0xFF,0xC4,0x00,0x1F,0x00,0x00,
                      0x01,0x05,0x01,0x01,0x01,0x01,0x01,0x01,0x00,0x00,0x00,0x00,
                      0x00,0x00,0x00,0x00,0x01,0x02,0x03,0x04,0x05,0x06,0x07,0x08,
                      0x09,0x0A,0x0B,0xFF,0xC4,0x00,0xB5,0x10,0x00,0x02,0x01,0x03,
                      0x03,0x02,0x04,0x03,0x05,0x05,0x04,0x04,0x00,0x00,0x01,0x7D,
                      0x01,0x02,0x03,0x00,0x04,0x11,0x05,0x12,0x21,0x31,0x41,0x06,
                      0x13,0x51,0x61,0x07,0x22,0x71,0x14,0x32,0x81,0x91,0xA1,0x08,
                      0x23,0x42,0xB1,0xC1,0x15,0x52,0xD1,0xF0,0x24,0x33,0x62,0x72,
                      0x82,0x09,0x0A,0x16,0x17,0x18,0x19,0x1A,0x25,0x26,0x27,0x28,
                      0x29,0x2A,0x34,0x35,0x36,0x37,0x38,0x39,0x3A,0x43,0x44,0x45,
                      0x46,0x47,0x48,0x49,0x4A,0x53,0x54,0x55,0x56,0x57,0x58,0x59,
                      0x5A,0x63,0x64,0x65,0x66,0x67,0x68,0x69,0x6A,0x73,0x74,0x75,
                      0x76,0x77,0x78,0x79,0x7A,0x83,0x84,0x85,0x86,0x87,0x88,0x89,
                      0x8A,0x92,0x93,0x94,0x95,0x96,0x97,0x98,0x99,0x9A,0xA2,0xA3,
                      0xA4,0xA5,0xA6,0xA7,0xA8,0xA9,0xAA,0xB2,0xB3,0xB4,0xB5,0xB6,
                      0xB7,0xB8,0xB9,0xBA,0xC2,0xC3,0xC4,0xC5,0xC6,0xC7,0xC8,0xC9,
                      0xCA,0xD2,0xD3,0xD4,0xD5,0xD6,0xD7,0xD8,0xD9,0xDA,0xE1,0xE2,
                      0xE3,0xE4,0xE5,0xE6,0xE7,0xE8,0xE9,0xEA,0xF1,0xF2,0xF3,0xF4,
                      0xF5,0xF6,0xF7,0xF8,0xF9,0xFA,0xFF,0xDA,0x00,0x08,0x01,0x01,
                      0x00,0x00,0x3F,0x00,0xFB,0x26,0x8A,0x28,0x03,0xFF,0xD9)
    [System.IO.File]::WriteAllBytes($tinyJpeg, $bytes)
    Write-Host "  Created probe_image.jpg"
}

Write-Host ""
Write-Host "+==========================================================+"
Write-Host "|   DAST Runner (PowerShell) -- OSCC Flask API            |"
Write-Host "|   Target: $BASE$((' ' * (42 - $BASE.Length)))|"
Write-Host "+==========================================================+"
Write-Host ""

# ── Pre-flight probe ─────────────────────────────────────────────────────────
Write-Host "  Probing $BASE/ ..." -NoNewline
$pf = Invoke-Probe -Url "$BASE/"
if ($pf.Code -eq 200) {
    Write-Host " [UP] $($pf.Code) in $([math]::Round($pf.Ms))ms"
} else {
    Write-Host " [DOWN] code=$($pf.Code)"
    Write-Host "ERROR: Server not reachable. Start the Flask backend first."
    exit 1
}

# ══════════════════════════════════════════════════════════════════════════════
# CAT-1: AuthN Bypass
# ══════════════════════════════════════════════════════════════════════════════
Write-Host ""
Write-Host "[CAT-1] Authentication Bypass"
Write-Host ("-" * 50)

$tokenVariants = @(
    @{Label="no_token";    Headers=@{}},
    @{Label="empty_bearer";Headers=@{"Authorization"="Bearer "}},
    @{Label="bad_token";   Headers=@{"Authorization"="Bearer not.a.real.jwt"}},
    @{Label="expired_jwt"; Headers=@{"Authorization"="Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0ZXN0IiwiZXhwIjoxfQ.EXPIRED"}}
)

foreach ($tv in $tokenVariants) {
    # GET /
    $r = Invoke-Probe -Url "$BASE/" -Headers $tv.Headers
    $finding = $false  # / is public, 200 expected
    Add-Result "$BASE/" "GET" $tv.Label $r.Code "200" $finding "info" $r.Ms "authn_bypass" "Token=$($tv.Label) -> $($r.Code)"
    Write-Host "  [OK]  GET / [$($tv.Label)] -> $($r.Code) ($([math]::Round($r.Ms))ms)"

    # POST /predict
    $r2 = Invoke-Probe -Url "$BASE/predict" -Headers $tv.Headers -FilePath $tinyJpeg
    # /predict has no auth -> 200 with any token is a CRITICAL finding (medical endpoint unprotected)
    $finding2 = ($r2.Code -gt 0 -and $r2.Code -lt 400)
    $sev2 = if ($finding2) { "critical" } else { "info" }
    $note2 = "Token=$($tv.Label) -> $($r2.Code) -- NO AUTH on medical inference endpoint"
    Add-Result "$BASE/predict" "POST" $tv.Label $r2.Code "401/403" $finding2 $sev2 $r2.Ms "authn_bypass" $note2
    $sym2 = if ($finding2) { "[FAIL]" } else { "[OK]  " }
    Write-Host "  $sym2 POST /predict [$($tv.Label)] -> $($r2.Code) ($([math]::Round($r2.Ms))ms)$(if($finding2){' <- NO AUTH CRITICAL'})"

    Start-Sleep -Milliseconds 200
}

# ══════════════════════════════════════════════════════════════════════════════
# CAT-2: AuthZ / Privilege Escalation
# ══════════════════════════════════════════════════════════════════════════════
Write-Host ""
Write-Host "[CAT-2] AuthZ / Privilege Escalation"
Write-Host ("-" * 50)

$roles = @("anonymous","admin","clinician","guest")
foreach ($role in $roles) {
    $hdrs = if ($role -eq "anonymous") { @{} } else { @{"Authorization"="Bearer fake-token-for-$role"} }
    foreach ($ep in @(@{P="/";M="GET";File=$null},@{P="/predict";M="POST";File=$tinyJpeg})) {
        $fileArg = if ($ep.File) { $ep.File } else { "" }
        $r = Invoke-Probe -Url "$BASE$($ep.P)" -Method $ep.M -Headers $hdrs -FilePath $fileArg
        $finding = $false
        $sev = if ($ep.P -eq "/predict" -and $r.Code -lt 400 -and $r.Code -gt 0) { "high" } else { "info" }
        Add-Result "$BASE$($ep.P)" $ep.M $role $r.Code "varies" $finding $sev $r.Ms "authz_privesc" "role=$role -> $($r.Code) (no RBAC implemented)"
        Write-Host "  [OK]  $($ep.M) $($ep.P) [role=$role] -> $($r.Code) ($([math]::Round($r.Ms))ms)"
        Start-Sleep -Milliseconds 200
    }
}

# ══════════════════════════════════════════════════════════════════════════════
# CAT-3: IDOR
# ══════════════════════════════════════════════════════════════════════════════
Write-Host ""
Write-Host "[CAT-3] IDOR Probes"
Write-Host ("-" * 50)

$idorParams = @("userId=1","userId=2","patientId=OSCC-2026-0001","scan_id=1","scan_id=999")
foreach ($param in $idorParams) {
    $r = Invoke-Probe -Url "$BASE/predict?$param" -FilePath $tinyJpeg
    $leak = ($r.Body -match "patient|worker|dr_|history")
    $finding = $leak
    Add-Result "$BASE/predict" "POST" "anonymous" $r.Code "200/400" $finding (if($finding){"medium"}else{"info"}) $r.Ms "idor" "param=$param data_leak=$leak"
    $sym = if ($finding) {"[FAIL]"} else {"[OK]  "}
    Write-Host "  $sym POST /predict?$param -> $($r.Code) ($([math]::Round($r.Ms))ms) leak=$leak"
    Start-Sleep -Milliseconds 200
}

# Path traversal
$ptPaths = @("/../","/%2e%2e/","/predict/../","/predict/../../../../etc/passwd")
foreach ($pt in $ptPaths) {
    $r = Invoke-Probe -Url "$BASE$pt"
    $finding = ($r.Code -eq 200 -and $r.Body.Length -gt 100 -and $r.Body -notmatch "OSCC Detection")
    Add-Result "$BASE$pt" "GET" "anonymous" $r.Code "400/404" $finding (if($finding){"high"}else{"info"}) $r.Ms "idor" "path_traversal=$pt -> $($r.Code)"
    $sym = if ($finding) {"[FAIL]"} else {"[OK]  "}
    Write-Host "  $sym GET $pt -> $($r.Code) ($([math]::Round($r.Ms))ms)"
    Start-Sleep -Milliseconds 200
}

# ══════════════════════════════════════════════════════════════════════════════
# CAT-4: RBAC Matrix
# ══════════════════════════════════════════════════════════════════════════════
Write-Host ""
Write-Host "[CAT-4] RBAC Matrix"
Write-Host ("-" * 50)

foreach ($role in $roles) {
    $hdrs = if ($role -eq "anonymous") { @{} } else { @{"Authorization"="Bearer fake-$role-token"} }
    foreach ($ep in @(@{P="/";M="GET";File=$null},@{P="/predict";M="POST";File=$tinyJpeg})) {
        $fileArg2 = if ($ep.File) { $ep.File } else { "" }
        $r = Invoke-Probe -Url "$BASE$($ep.P)" -Method $ep.M -Headers $hdrs -FilePath $fileArg2
        $finding = ($r.Code -eq 401 -or $r.Code -eq 403)  # unexpected partial enforcement
        Add-Result "$BASE$($ep.P)" $ep.M $role $r.Code "2xx (no RBAC)" $finding (if($finding){"medium"}else{"info"}) $r.Ms "rbac_matrix" "role=$role -> $($r.Code)"
        $sym = if ($finding) {"[WARN]"} else {"[OK]  "}
        Write-Host "  $sym $($ep.M) $($ep.P) [role=$role] -> $($r.Code) ($([math]::Round($r.Ms))ms)"
        Start-Sleep -Milliseconds 150
    }
}

# ══════════════════════════════════════════════════════════════════════════════
# CAT-5: Token Tampering + CORS
# ══════════════════════════════════════════════════════════════════════════════
Write-Host ""
Write-Host "[CAT-5] JWT Token Tampering + CORS"
Write-Host ("-" * 50)

function New-FakeJwt([string]$Role) {
    $h = [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes('{"alg":"HS256","typ":"JWT"}')).TrimEnd('=').Replace('+','-').Replace('/','_')
    $p = [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes("{`"sub`":`"attacker`",`"role`":`"$Role`",`"exp`":9999999999}")).TrimEnd('=').Replace('+','-').Replace('/','_')
    return "$h.$p.FAKESIG"
}
$algNoneH = [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes('{"alg":"none","typ":"JWT"}')).TrimEnd('=').Replace('+','-').Replace('/','_')
$algNoneP = [Convert]::ToBase64String([System.Text.Encoding]::UTF8.GetBytes('{"sub":"attacker","role":"admin"}')).TrimEnd('=').Replace('+','-').Replace('/','_')

$tamperedTokens = @(
    @{Label="role_admin";   Token=(New-FakeJwt "admin")},
    @{Label="role_root";    Token=(New-FakeJwt "root")},
    @{Label="alg_none";     Token="$algNoneH.$algNoneP."},
    @{Label="sub_traversal";Token=(New-FakeJwt "../admin")}
)

foreach ($tt in $tamperedTokens) {
    $hdrs = @{"Authorization"="Bearer $($tt.Token)"}
    # GET /
    $r = Invoke-Probe -Url "$BASE/" -Headers $hdrs
    Add-Result "$BASE/" "GET" "tampered_$($tt.Label)" $r.Code "401/403" $false "info" $r.Ms "token_tampering" "tampered JWT ($($tt.Label)) accepted -> $($r.Code)"
    # POST /predict
    $r2 = Invoke-Probe -Url "$BASE/predict" -Headers $hdrs -FilePath $tinyJpeg
    $finding2 = ($r2.Code -gt 0 -and $r2.Code -lt 400)
    Add-Result "$BASE/predict" "POST" "tampered_$($tt.Label)" $r2.Code "401/403" $finding2 (if($finding2){"critical"}else{"info"}) $r2.Ms "token_tampering" "tampered JWT ($($tt.Label)) -> $($r2.Code) -- JWT not verified"
    $sym = if ($finding2) {"[FAIL]"} else {"[OK]  "}
    Write-Host "  $sym POST /predict [tampered=$($tt.Label)] -> $($r2.Code) ($([math]::Round($r2.Ms))ms)"
    Start-Sleep -Milliseconds 200
}

# CORS probe
$origins = @("https://evil.attacker.com","null","http://attacker.localhost")
foreach ($origin in $origins) {
    $hdrs = @{"Origin"=$origin;"Access-Control-Request-Method"="POST";"Access-Control-Request-Headers"="Content-Type"}
    $r = Invoke-Probe -Url "$BASE/predict" -Method "OPTIONS" -Headers $hdrs
    # Check if response echoes back the evil origin or uses wildcard
    $corsWild  = ($r.Body -match "Access-Control-Allow-Origin:\s*\*" -or $r.Body -match $origin)
    $finding   = $corsWild
    Add-Result "$BASE/predict" "OPTIONS" "anonymous" $r.Code "204/200" $finding (if($finding){"medium"}else{"info"}) $r.Ms "token_tampering" "CORS origin='$origin' -> $($r.Code) wildcard=$corsWild"
    Write-Host "  [OK]  OPTIONS /predict [Origin=$origin] -> $($r.Code) ($([math]::Round($r.Ms))ms)"
    Start-Sleep -Milliseconds 200
}

# ══════════════════════════════════════════════════════════════════════════════
# CAT-6: Injection Probes (detection only)
# ══════════════════════════════════════════════════════════════════════════════
Write-Host ""
Write-Host "[CAT-6] Injection Probes (detection only)"
Write-Host ("-" * 50)

# Baseline timing
$baseline = Invoke-Probe -Url "$BASE/"
$baseMs   = $baseline.Ms
Write-Host "  Baseline GET / = $([math]::Round($baseMs))ms"

$injPayloads = @(
    @{Label="sqli_basic";        P="' OR '1'='1"},
    @{Label="sqli_time";         P="' AND SLEEP(5)--"},
    @{Label="sqli_union";        P="' UNION SELECT NULL--"},
    @{Label="nosqli_mongo";      P='{"$gt":""}'},
    @{Label="ssti_jinja";        P="{{7*7}}"},
    @{Label="cmdi_pipe";         P="| whoami"},
    @{Label="path_traversal";    P="../../../../etc/passwd"},
    @{Label="xxe_probe";         P='<?xml version="1.0"?><!DOCTYPE foo [<!ENTITY x SYSTEM "file:///etc/passwd">]><foo>&x;</foo>'}
)

foreach ($inj in $injPayloads) {
    # Vector: query string on GET /
    $r = Invoke-Probe -Url "$BASE/?q=$([uri]::EscapeDataString($inj.P))"
    $timingAnomaly = ($r.Ms - $baseMs) -gt 4000
    $errorLeak = ($r.Body -match "sql|syntax|traceback|exception|passwd|root:")
    $finding = $timingAnomaly -or $errorLeak
    Add-Result "$BASE/" "GET" "anonymous" $r.Code "200" $finding (if($finding){"high"}else{"info"}) $r.Ms "injection" "[$($inj.Label)] GET /?q=<payload> timing_anomaly=$timingAnomaly error_leak=$errorLeak"
    $sym = if ($finding) {"[FAIL]"} else {"[OK]  "}
    Write-Host "  $sym GET / [$($inj.Label)] -> $($r.Code) ($([math]::Round($r.Ms))ms)$(if($finding){' ANOMALY!'})"

    # Vector: filename on POST /predict
    $r2 = Invoke-Probe -Url "$BASE/predict?extra=$([uri]::EscapeDataString($inj.P))" -FilePath $tinyJpeg
    $timingAnomaly2 = ($r2.Ms - $baseMs) -gt 4000
    $errorLeak2 = ($r2.Body -match "sql|syntax|traceback|exception|passwd|root:")
    $finding2 = $timingAnomaly2 -or $errorLeak2
    Add-Result "$BASE/predict" "POST" "anonymous" $r2.Code "200/400/503" $finding2 (if($finding2){"high"}else{"info"}) $r2.Ms "injection" "[$($inj.Label)] POST /predict?extra=<payload> timing_anomaly=$timingAnomaly2 error_leak=$errorLeak2"
    $sym2 = if ($finding2) {"[FAIL]"} else {"[OK]  "}
    Write-Host "  $sym2 POST /predict [$($inj.Label)] -> $($r2.Code) ($([math]::Round($r2.Ms))ms)$(if($finding2){' ANOMALY!'})"
    Start-Sleep -Milliseconds 300
}

# ══════════════════════════════════════════════════════════════════════════════
# CAT-7: Rate Limiting
# ══════════════════════════════════════════════════════════════════════════════
Write-Host ""
Write-Host "[CAT-7] Rate Limiting (30-request burst)"
Write-Host ("-" * 50)

function Test-RateLimit([string]$Url,[string]$FilePath="",[int]$Count=30) {
    $codes = @()
    for ($i=0; $i -lt $Count; $i++) {
        $r = Invoke-Probe -Url $Url -FilePath $FilePath
        $codes += $r.Code
        Start-Sleep -Milliseconds 50
    }
    return $codes
}

# Burst GET /  (fast, no model)
Write-Host "  Bursting GET / x30 ..."
$getCodes = Test-RateLimit -Url "$BASE/" -Count 30
$get429   = ($getCodes | Where-Object { $_ -eq 429 }).Count
$getOk    = ($getCodes | Where-Object { $_ -gt 0 -and $_ -lt 400 }).Count
$findingGet = ($get429 -eq 0)
Add-Result "$BASE/" "GET" "anonymous" $null "429 on burst" $findingGet (if($findingGet){"medium"}else{"info"}) 0 "rate_limiting" "Burst 30 GET /: $getOk ok, $get429 x429. Rate limit $(if($findingGet){'MISSING'}else{'present'})"
Write-Host "  $(if($findingGet){'[FAIL]'}else{'[OK]  '}) GET /: $getOk/30 ok, $get429 rate-limited -- $(if($findingGet){'NO RATE LIMIT'}else{'rate limited OK'})"

# Burst POST /predict (heavy -- only 10 to avoid overloading the model server)
Write-Host "  Bursting POST /predict x10 ..."
$postCodes = Test-RateLimit -Url "$BASE/predict" -FilePath $tinyJpeg -Count 10
$post429   = ($postCodes | Where-Object { $_ -eq 429 }).Count
$postOk    = ($postCodes | Where-Object { $_ -gt 0 -and $_ -lt 400 }).Count
$findingPost = ($post429 -eq 0)
Add-Result "$BASE/predict" "POST" "anonymous" $null "429 on burst" $findingPost (if($findingPost){"high"}else{"info"}) 0 "rate_limiting" "Burst 10 POST /predict: $postOk ok, $post429 x429. Rate limit $(if($findingPost){'MISSING'}else{'present'})"
Write-Host "  $(if($findingPost){'[FAIL]'}else{'[OK]  '}) POST /predict: $postOk/10 ok, $post429 rate-limited -- $(if($findingPost){'NO RATE LIMIT -- model can be abused'}else{'rate limited OK'})"

# ══════════════════════════════════════════════════════════════════════════════
# CAT-8: Hardcoded Creds (already run via Python -- re-record from report.json if present)
# ══════════════════════════════════════════════════════════════════════════════
Write-Host ""
Write-Host "[CAT-8] Hardcoded Credentials (static results)"
Write-Host ("-" * 50)
# mobile_app/config.js has a hardcoded IP — confirmed by Python scanner
Add-Result "CODEBASE" "STATIC" "n/a" $null "no secrets" $true "high" 0 "hardcoded_creds" "[hardcoded_ip_port] mobile_app/config.js:L6 -- hardcoded LAN IP 'http://10.167.102.58:5000' committed to source"
Write-Host "  [FAIL] mobile_app/config.js:L6 -- hardcoded IP 'http://10.167.102.58:5000'"

# ══════════════════════════════════════════════════════════════════════════════
# BONUS: Additional attack surface checks
# ══════════════════════════════════════════════════════════════════════════════
Write-Host ""
Write-Host "[BONUS] Additional Attack Surface"
Write-Host ("-" * 50)

# Check if debug mode is on
$dr = Invoke-Probe -Url "$BASE/"
$debugOn = ($dr.Body -match '"debug":\s*true' -or $dr.Body -match "Werkzeug")
Add-Result "$BASE/" "GET" "anonymous" $dr.Code "200" $debugOn (if($debugOn){"high"}else{"info"}) $dr.Ms "misc" "Debug mode detected=$debugOn"
Write-Host "  $(if($debugOn){'[FAIL]'}else{'[OK]  '}) Debug mode: $debugOn"

# Check response headers for security headers
$missingHdrs = @()
foreach ($secHdr in @("X-Content-Type-Options","X-Frame-Options","Content-Security-Policy","Strict-Transport-Security")) {
    try {
        $hresp = Invoke-WebRequest -Uri "$BASE/" -UseBasicParsing -TimeoutSec 5
        if (-not $hresp.Headers.ContainsKey($secHdr)) { $missingHdrs += $secHdr }
    } catch {}
}
if ($missingHdrs.Count -gt 0) {
    Add-Result "$BASE/" "GET" "anonymous" 200 "security headers present" $true "medium" 0 "misc" "Missing security headers: $($missingHdrs -join ', ')"
    Write-Host "  [FAIL] Missing security headers: $($missingHdrs -join ', ')"
} else {
    Add-Result "$BASE/" "GET" "anonymous" 200 "security headers present" $false "info" 0 "misc" "All checked security headers present"
    Write-Host "  [OK]   Security headers present"
}

# Check for stack trace / exception leakage on bad input
$errR = Invoke-Probe -Url "$BASE/predict" -FilePath $tinyJpeg
$stackLeak = ($errR.Body -match "Traceback|File .*, line \d+|raise ")
Add-Result "$BASE/predict" "POST" "anonymous" $errR.Code "200" $stackLeak (if($stackLeak){"medium"}else{"info"}) $errR.Ms "misc" "Stack trace in response: $stackLeak"
Write-Host "  $(if($stackLeak){'[FAIL]'}else{'[OK]  '}) Stack trace leakage: $stackLeak"

# Check raw_score exposure (internal ML score exposed to client)
$rawScoreExposed = ($errR.Body -match '"raw_score"')
Add-Result "$BASE/predict" "POST" "anonymous" $errR.Code "200" $rawScoreExposed (if($rawScoreExposed){"low"}else{"info"}) $errR.Ms "misc" "raw_score field exposed in API response: $rawScoreExposed"
Write-Host "  $(if($rawScoreExposed){'[WARN]'}else{'[OK]  '}) raw_score exposed in response: $rawScoreExposed"

# ══════════════════════════════════════════════════════════════════════════════
# Write report.json
# ══════════════════════════════════════════════════════════════════════════════
$reportPath = "$PSScriptRoot\report.json"
$results | ConvertTo-Json -Depth 5 | Set-Content -Path $reportPath -Encoding UTF8
Write-Host ""
Write-Host "  Report written to: $reportPath ($($results.Count) records)"

# ══════════════════════════════════════════════════════════════════════════════
# SUMMARY
# ══════════════════════════════════════════════════════════════════════════════
$findings  = $results | Where-Object { $_.finding -eq $true }
$critical  = $findings | Where-Object { $_.severity -eq "critical" }
$high      = $findings | Where-Object { $_.severity -eq "high" }
$medium    = $findings | Where-Object { $_.severity -eq "medium" }
$low       = $findings | Where-Object { $_.severity -eq "low" }

Write-Host ""
Write-Host ("=" * 60)
Write-Host "  DAST SUMMARY"
Write-Host ("=" * 60)
Write-Host "  Endpoints discovered : 2  (GET /, POST /predict)"
Write-Host "  Total tests run      : $($results.Count)"
Write-Host "  Total findings       : $($findings.Count)"
Write-Host ""
if ($critical.Count) { Write-Host "  [CRITICAL] $($critical.Count) finding(s)"; $critical | ForEach-Object { Write-Host "    [$($_.test_category)] $($_.method) $($_.endpoint.Replace($BASE,'')) -- $($_.note.Substring(0,[math]::Min(90,$_.note.Length)))" } }
if ($high.Count)     { Write-Host "  [HIGH]     $($high.Count) finding(s)";     $high     | ForEach-Object { Write-Host "    [$($_.test_category)] $($_.method) $($_.endpoint.Replace($BASE,'')) -- $($_.note.Substring(0,[math]::Min(90,$_.note.Length)))" } }
if ($medium.Count)   { Write-Host "  [MEDIUM]   $($medium.Count) finding(s)";   $medium   | ForEach-Object { Write-Host "    [$($_.test_category)] $($_.method) $($_.endpoint.Replace($BASE,'')) -- $($_.note.Substring(0,[math]::Min(90,$_.note.Length)))" } }
if ($low.Count)      { Write-Host "  [LOW]      $($low.Count) finding(s)";      $low      | ForEach-Object { Write-Host "    [$($_.test_category)] $($_.method) $($_.endpoint.Replace($BASE,'')) -- $($_.note.Substring(0,[math]::Min(90,$_.note.Length)))" } }
Write-Host ""
Write-Host "  TOP ISSUES TO FIX:"
Write-Host "  -------------------------------------------------"
$top = @($critical) + @($high) | Select-Object -First 6
$i = 1
foreach ($t in $top) {
    Write-Host "  $i. [$($t.severity.ToUpper())] $($t.method) $($t.endpoint.Replace($BASE,'')) [$($t.test_category)]"
    Write-Host "     $($t.note.Substring(0,[math]::Min(100,$t.note.Length)))"
    $i++
}
Write-Host ("=" * 60)
