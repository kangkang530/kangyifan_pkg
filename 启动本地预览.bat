@echo off
chcp 65001 >nul
cd /d %~dp0

rem 确定 Python 解释器：优先使用项目虚拟环境 .venv，其次使用系统 PATH 中的 python
set "PYTHON_EXE="
if exist ".venv\Scripts\python.exe" (
    set "PYTHON_EXE=.venv\Scripts\python.exe"
) else (
    where python >nul 2>nul
    if %errorlevel%==0 (
        set "PYTHON_EXE=python"
    ) else (
        echo [错误] 未找到 Python，请先创建虚拟环境或安装 Python。
        echo        推荐执行: python -m venv .venv
        pause
        exit /b 1
    )
)

rem 检查 mkdocs 是否已安装
%PYTHON_EXE% -c "import mkdocs" 2>nul
if %errorlevel% neq 0 (
    echo [提示] mkdocs 未安装，正在自动安装依赖...
    %PYTHON_EXE% -m pip install -r requirements.txt -i https://pypi.tuna.tsinghua.edu.cn/simple
)

rem 检查 8000 端口是否已有服务在运行
netstat -ano | findstr ":8000 " | findstr "LISTENING" >nul
if %errorlevel%==0 (
    echo [提示] 预览服务已在运行，直接打开浏览器...
) else (
    echo [提示] 正在启动 MkDocs 预览服务，请稍候...
    start "MkDocs预览服务(关闭此窗口即停止)" /min %PYTHON_EXE% -m mkdocs serve -a 127.0.0.1:8000
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
