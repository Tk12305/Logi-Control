# Logi Controls - Arch Linux Installation Guide

This guide explains how to install **Logi Controls** on Arch Linux and Arch-based distributions.

Repository:

https://github.com/Tk12305/Logi-Control

---

## Requirements

Before installing, make sure you have the required tools installed:

```bash
sudo pacman -S git unzip bash
```

---

# Installation

There are two ways to install Logi Controls:

- **Method 1:** Clone the repository using Git (recommended)
- **Method 2:** Download and install from the ZIP file

---

# Method 1 - Install Using Git (Recommended)

## 1. Clone the Repository

Open a terminal and run:

```bash
cd ~/Downloads
git clone https://github.com/Tk12305/Logi-Control.git
```

## 2. Enter the Directory

```bash
cd Logi-Control
```

## 3. Run the Installer

Run:

```bash
bash install.sh
```

The installer will install and configure Logi Controls.

---

# Method 2 - Install Using ZIP Download

## 1. Download the Source Code

Download the latest ZIP file from:

https://github.com/Tk12305/Logi-Control

Save it to your Downloads folder.

## 2. Extract the Files

Open a terminal and run:

```bash
cd ~/Downloads
unzip -o Logi-Control-main.zip
```

## 3. Enter the Directory

```bash
cd Logi-Control-main
```

## 4. Run the Installer

Run:

```bash
bash install.sh
```

The installer will install and configure Logi Controls.

---

# Updating Logi Controls

To update Logi Controls, download the latest version and run the installer again.

### Git installation:

```bash
cd ~/Downloads/Logi-Control
git pull
bash install.sh
```

### ZIP installation:

Extract the latest ZIP file and run:

```bash
bash install.sh
```

---

# Troubleshooting

## Permission denied when running install.sh

Run:

```bash
chmod +x install.sh
bash install.sh
```

## unzip command not found

Install unzip:

```bash
sudo pacman -S unzip
```

## git command not found

Install Git:

```bash
sudo pacman -S git
```

---

# Support

If you encounter issues, report them on GitHub:

https://github.com/Tk12305/Logi-Control/issues
