# Python Installation Guide for Windows

Quick guide to install Python 3.11 for HY-Motion and development tools.

---

## 🚀 Quick Install (Recommended)

### Method 1: Winget (Windows Package Manager)

```powershell
# Install Python 3.11
winget install Python.Python.3.11

# Verify installation
python --version

# Should show: Python 3.11.x
```

### Method 2: Official Installer

1. **Download Python 3.11.7**:
   - Visit: https://www.python.org/downloads/
   - Click "Download Python 3.11.7"

2. **Run installer**:
   - ✅ Check "Add Python 3.11 to PATH"
   - ✅ Check "Install pip"
   - Click "Install Now"

3. **Verify**:
```powershell
python --version
pip --version
```

---

## 📦 Essential Packages

After Python is installed:

```powershell
# Upgrade pip
python -m pip install --upgrade pip

# Install essential tools
pip install --upgrade setuptools wheel

# Install HuggingFace CLI (for downloading models)
pip install huggingface_hub

# Install git-lfs (for large files)
git lfs install
```

---

## 🔧 Configure Python for Development

### Set up virtual environment (optional but recommended)

```powershell
# Create virtual environment
python -m venv C:\Users\david\venv\starway

# Activate it
C:\Users\david\venv\starway\Scripts\Activate.ps1

# Your prompt should change to show (starway)
```

### Set environment variables

```powershell
# Add to PATH permanently
[Environment]::SetEnvironmentVariable("Path", $env:Path + ";C:\Python311\Scripts", "User")

# Set Python location
[Environment]::SetEnvironmentVariable("PYTHON_HOME", "C:\Python311", "User")
```

---

## ✅ Verification Checklist

Run these commands to verify everything works:

```powershell
# Python version
python --version
# Should show: Python 3.11.x

# Pip version
pip --version
# Should show: pip 23.x or higher

# HuggingFace CLI
huggingface-cli --version
# Should show version info

# Git LFS
git lfs version
# Should show: git-lfs/3.x
```

---

## 🐛 Troubleshooting

### "Python not found"
```powershell
# Close and reopen PowerShell
# OR add to PATH manually:
$env:Path += ";C:\Python311;C:\Python311\Scripts"
```

### "Access Denied" during install
```powershell
# Run PowerShell as Administrator
# Right-click PowerShell → Run as Administrator
```

### "Execution Policy" error
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

---

## 🎯 Next Steps

After Python is installed:

1. ✅ Python installed and verified
2. ⬜ Install HY-Motion dependencies (if using cloud GPU)
3. ⬜ Set up Mixamo integration for immediate animations
4. ⬜ Configure cloud GPU deployment

---

**Run this to test everything:**

```powershell
python -c "import sys; print(f'Python {sys.version} installed successfully!')"
pip list
```

If you see Python version info, you're ready! 🎉
