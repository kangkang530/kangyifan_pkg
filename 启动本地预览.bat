@echo off
chcp 65001 >nul
cd /d %~dp0

rem 检查 8000 端口是否已有服务在运行
netstat -ano | findstr ":8000 " | findstr "LISTENING" >nul
if %errorlevel%==0 (
    echo [提示] 预览服务已在运行，直接打开浏览器...
) else (
    echo [提示] 正在启动 MkDocs 预览服务，请稍候...
    start "MkDocs预览服务(关闭此窗口即停止)" /min "D:\uncle\ana anzhuangdizhi\python.exe" -m mkdocs serve -a 127.0.0.1:8000
    rem 等待服务完成首次构建
    timeout /t 5 /nobreak >nul
)

start "" http://127.0.0.1:8000/kangyifan_pkg/
echo.
echo ============================================
echo  浏览器已打开本地预览页面
echo  修改 .md 文件并保存后，页面会自动刷新
echo  停止预览：关闭任务栏中的"MkDocs预览服务"窗口
echo ============================================
echo.
pause
