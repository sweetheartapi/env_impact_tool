@echo off
rem Launches the assessment tool from the project folder so that
rem .streamlit\config.toml (light theme, green accent) is picked up.
cd /d "%~dp0"
python -m streamlit run app.py
