Set neuronShell = CreateObject("WScript.Shell")
neuronCommand = "powershell.exe -NoProfile -WindowStyle Hidden -Command ""$neuronListener = Get-NetTCPConnection -State Listen -LocalPort 5173 -ErrorAction SilentlyContinue; if (-not $neuronListener) { Start-Process -WindowStyle Hidden -FilePath py -ArgumentList '-m','http.server','5173','--bind','127.0.0.1' -WorkingDirectory 'C:\Users\Pramit\Desktop\IQ' }; Start-Sleep -Milliseconds 600; Start-Process 'http://127.0.0.1:5173'"""
neuronShell.Run neuronCommand, 0, False
