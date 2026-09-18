# Logi Control - Arch Linux Installation Guide

This guide explains how to install **Logi Control** on Arch Linux and Arch-based distributions. The installer adds Electron, Solaar, BlueZ, and BlueZ utilities, then enables the Bluetooth service and creates an application-launcher entry.

Repository:

https://github.com/Tk12305/Logi-Control

---

## Requirements

Before installing, make sure you have Git or unzip available, depending on how you download the project:

```bash
sudo pacman -S git unzip bash
```

---

# Installation

There are two ways to install Logi Control:

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

The installer will install and configure Logi Control. It asks for your password only to install Arch packages and enable Bluetooth.

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

The installer will install and configure Logi Control. It asks for your password only to install Arch packages and enable Bluetooth.

---

# Updating Logi Control

To update Logi Control, download the latest version and run the installer again. Your app launcher continues to point at the installed copy in `~/.local/share/logi-arch-control`.

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

## First run and Bluetooth

On its first run, Logi Control checks for Solaar, Bluetooth support, and compatible devices. If Solaar is unavailable, use the command displayed by the guide or run:

```bash
sudo pacman -S --needed solaar bluez bluez-utils
sudo systemctl enable --now bluetooth.service
```

For Bluetooth pairing, put the device into pairing mode, use **Scan nearby** in Logi Control, copy the reported Bluetooth address into the address field, then choose **Pair & trust**. The app can also connect, disconnect, and forget a paired device.

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
