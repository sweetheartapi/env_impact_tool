@echo off
rem Launches the assessment tool.
rem The theme is passed explicitly as well as living in .streamlit\config.toml, so the
rem light palette applies even if that file is not picked up (e.g. the app is launched
rem from another folder) or the browser is set to dark mode.
cd /d "%~dp0"
python -m streamlit run app.py --theme.base=light --theme.primaryColor=#1E6A47 --theme.backgroundColor=#F7F7F1 --theme.secondaryBackgroundColor=#FFFFFF --theme.textColor=#1C2A22
