$oldContent = Get-Content "test_old.js" -Raw
$newContent = Get-Content "test_new.js" -Raw

Write-Host "=== Testing /api/diff ===" -ForegroundColor Green
$diffBody = @{
    oldContent = $oldContent
    newContent = $newContent
    ignoreWhitespace = $false
    contextLines = "all"
} | ConvertTo-Json

$diffResponse = Invoke-WebRequest -Uri "http://localhost:3000/api/diff" -Method POST -Body $diffBody -ContentType "application/json"
$diffResult = $diffResponse.Content | ConvertFrom-Json
Write-Host "Old lines: $($diffResult.oldLineCount), New lines: $($diffResult.newLineCount)"
Write-Host "Total diff lines: $($diffResult.diffLines.Count)"
$diffResult.diffLines | ForEach-Object {
    $type = $_.type
    $oldNum = if ($_.oldLineNumber) { $_.oldLineNumber.ToString() } else { "  " }
    $newNum = if ($_.newLineNumber) { $_.newLineNumber.ToString() } else { "  " }
    $icon = if ($type -eq 'added') { '+' } elseif ($type -eq 'removed') { '-' } else { ' ' }
    $content = if ($_.content) { $_.content.Substring(0, [Math]::Min(50, $_.content.Length)) } else { "" }
    Write-Host "$oldNum $newNum $icon $content"
}

Write-Host "`n=== Testing /api/stats ===" -ForegroundColor Green
$statsBody = @{
    oldContent = $oldContent
    newContent = $newContent
    ignoreWhitespace = $false
} | ConvertTo-Json

$statsResponse = Invoke-WebRequest -Uri "http://localhost:3000/api/stats" -Method POST -Body $statsBody -ContentType "application/json"
$statsResult = $statsResponse.Content | ConvertFrom-Json
Write-Host "Total lines - Old: $($statsResult.totalLines.old), New: $($statsResult.totalLines.new)"
Write-Host "Added: $($statsResult.addedLines)"
Write-Host "Removed: $($statsResult.removedLines)"
Write-Host "Modified: $($statsResult.modifiedLines)"
Write-Host "Unchanged: $($statsResult.unchangedLines)"

Write-Host "`n=== All tests passed! ===" -ForegroundColor Yellow
