# Script PowerShell para enviar email de prueba
# Uso: .\test-email.ps1 -EmailDestino "tu_email@tempmail.local"

param(
    [Parameter(Mandatory=$false)]
    [string]$EmailDestino = "test123@tempmail.local"
)

Write-Host "📧 Enviando email de prueba..." -ForegroundColor Cyan
Write-Host "📬 Destinatario: $EmailDestino" -ForegroundColor Yellow
Write-Host ""

try {
    # Crear objeto SMTP
    $smtp = New-Object Net.Mail.SmtpClient("localhost", 2525)
    $smtp.EnableSsl = $false
    
    # Crear mensaje
    $mensaje = New-Object Net.Mail.MailMessage
    $mensaje.From = "test@example.com"
    $mensaje.To.Add($EmailDestino)
    $mensaje.Subject = "Email de Prueba desde PowerShell"
    $mensaje.IsBodyHtml = $true
    
    $mensaje.Body = @"
<html>
<head>
    <style>
        body { font-family: Arial, sans-serif; padding: 20px; background: #f5f5f5; }
        .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        h1 { color: #14b8a6; margin-bottom: 20px; }
        .info-box { background: #f0fdfa; border-left: 4px solid #14b8a6; padding: 15px; margin: 20px 0; }
        .success { color: #059669; font-weight: bold; }
        .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 12px; }
        ul { list-style: none; padding: 0; }
        li { padding: 8px 0; border-bottom: 1px solid #e5e7eb; }
        li:last-child { border-bottom: none; }
        strong { color: #374151; }
    </style>
</head>
<body>
    <div class="container">
        <h1>✅ ¡Email de Prueba Exitoso!</h1>
        <p>Este es un mensaje de prueba enviado desde el script <code>test-email.ps1</code></p>
        
        <div class="info-box">
            <h3 style="margin-top: 0;">📊 Información del Envío</h3>
            <ul>
                <li><strong>Fecha:</strong> $(Get-Date -Format "dd/MM/yyyy HH:mm:ss")</li>
                <li><strong>Servidor SMTP:</strong> localhost:2525</li>
                <li><strong>Remitente:</strong> test@example.com</li>
                <li><strong>Destinatario:</strong> $EmailDestino</li>
                <li><strong>Método:</strong> PowerShell SMTP Client</li>
            </ul>
        </div>
        
        <p class="success">🎉 Si puedes leer este mensaje, tu servidor de correo temporal está funcionando perfectamente!</p>
        
        <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
            <strong>💡 Consejo:</strong> Los emails temporales expiran automáticamente después de 1 hora.
        </div>
        
        <div class="footer">
            <p>Enviado con ❤️ desde TempMail App</p>
            <p style="font-size: 10px; color: #9ca3af;">Powered by Node.js + React</p>
        </div>
    </div>
</body>
</html>
"@
    
    # Enviar email
    Write-Host "📤 Conectando al servidor SMTP..." -ForegroundColor Gray
    $smtp.Send($mensaje)
    
    Write-Host ""
    Write-Host "✅ Email enviado exitosamente!" -ForegroundColor Green
    Write-Host "🌐 Abre http://localhost:3000 para ver el mensaje" -ForegroundColor Cyan
    Write-Host ""
    
} catch {
    Write-Host ""
    Write-Host "❌ Error al enviar el email:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    Write-Host "💡 Soluciones:" -ForegroundColor Yellow
    Write-Host "   1. Verifica que el servidor esté corriendo: npm run server" -ForegroundColor Gray
    Write-Host "   2. Comprueba que el puerto 2525 esté disponible" -ForegroundColor Gray
    Write-Host "   3. Asegúrate que el email destino sea correcto" -ForegroundColor Gray
    Write-Host ""
}

# Limpiar objetos
if ($mensaje) { $mensaje.Dispose() }
if ($smtp) { $smtp.Dispose() }
