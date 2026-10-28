Write-Host ">>> Setting Java Environment from Android Studio JBR..." -ForegroundColor Cyan
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"

Write-Host ">>> Syncing Capacitor Android assets..." -ForegroundColor Cyan
npx cap sync android

Write-Host ">>> Building Android APK using Gradle..." -ForegroundColor Cyan
Push-Location android
.\gradlew.bat assembleDebug
Pop-Location

if (Test-Path "android\app\build\outputs\apk\debug\app-debug.apk") {
    Copy-Item "android\app\build\outputs\apk\debug\app-debug.apk" -Destination "GrowthPilot-AI.apk" -Force
    $size = [math]::Round((Get-Item "GrowthPilot-AI.apk").Length / 1MB, 2)
    Write-Host "`n>>> SUCCESS! Android APK generated at:" -ForegroundColor Green
    Write-Host "    $((Get-Item 'GrowthPilot-AI.apk').FullName) ($size MB)`n" -ForegroundColor Yellow
} else {
    Write-Host "`n>>> Build failed or APK not found." -ForegroundColor Red
}
