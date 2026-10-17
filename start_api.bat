@echo off
echo Starting BISINDO FastAPI Server...
if exist .\venv\Scripts\activate.bat (
    call .\venv\Scripts\activate.bat
)
python 4_api.py
pause
