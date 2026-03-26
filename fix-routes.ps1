Get-ChildItem "C:/Users/timsong/.openclaw/workspace/prompt-studio/backend/src/routes/" -Recurse -Include "*.ts" | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    $newContent = $content -replace 'const router = Router\(\);', 'const router: Router = Router();'
    if ($content -ne $newContent) {
        Set-Content $_.FullName -Value $newContent -NoNewline
        Write-Host "Fixed: $($_.FullName)"
    }
}
Get-ChildItem "C:/Users/timsong/.openclaw/workspace/prompt-studio/backend/src/controllers/" -Recurse -Include "*.ts" | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    $newContent = $content -replace 'const router = Router\(\);', 'const router: Router = Router();'
    if ($content -ne $newContent) {
        Set-Content $_.FullName -Value $newContent -NoNewline
        Write-Host "Fixed: $($_.FullName)"
    }
}
Get-ChildItem "C:/Users/timsong/.openclaw/workspace/prompt-studio/backend/src/services/" -Recurse -Include "*.ts" | ForEach-Object {
    $content = Get-Content $_.FullName -Raw
    $newContent = $content -replace 'const router = Router\(\);', 'const router: Router = Router();'
    if ($content -ne $newContent) {
        Set-Content $_.FullName -Value $newContent -NoNewline
        Write-Host "Fixed: $($_.FullName)"
    }
}
