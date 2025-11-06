# Rollout - Lando to DDEV upgrade

This document describes the process of upgrading Lando to DDEV as the local development environment for Wunder’s projects.

## 1. Prerequisites for DDEV installation

Before installing DDEV into your system, make sure that the following are valid with your system, both MacOS and Ubuntu:
 - RAM: 8 GB
 - Storage: 256GB

Specific requirements for MacOS:
 - MacOS Sonoma 14 or higher.
 - OrbStack or Lima or Docker Desktop or Rancher Desktop or Colima.

Once these are done, the next steps will be:
 - Install Docker with recommended settings.
 - Install DDEV for Linux. (See chapter 2. Installing DDEV)
 - Launch the project. (See also chapter 3. Setting up the DDEV for a project)

## 2. Installing DDEV

#### Install DDEV to your machine. Available for both Ubuntu and Apple.

As Lando is getting outdated, we’re moving towards DDEV as a better and up-to-date solution for local development. Installing DDEV is a quite straightforward process. This document provides steps on how to install DDEV on your local machine and to integrate old Lando environments into DDEV environments.

### 2.1 DDEV installation for Linux

Before the installation, remember to run lando poweroff -y to shutdown any lando processes in your system.

To install DDEV for Ubuntu Debian, follow these steps:

```shell
# Add DDEV’s GPG key to your keyring
sudo sh -c 'echo ""'
sudo apt-get update && sudo apt-get install -y curl
sudo install -m 0755 -d /etc/apt/keyrings
curl -fsSL https://pkg.ddev.com/apt/gpg.key | gpg --dearmor | sudo tee /etc/apt/keyrings/ddev.gpg > /dev/null
sudo chmod a+r /etc/apt/keyrings/ddev.gpg

# Add DDEV releases to your package repository
sudo sh -c 'echo ""'
echo "deb [signed-by=/etc/apt/keyrings/ddev.gpg] https://pkg.ddev.com/apt/ * *" | sudo tee /etc/apt/sources.list.d/ddev.list >/dev/null

# Update package information and install DDEV
sudo sh -c 'echo ""'
sudo apt-get update && sudo apt-get install -y ddev

# One-time initialization of mkcert
mkcert -install
```

### 2.2 DDEV installation for Apple

To install DDEV for Apple Homebrew, follow these steps:

```shell
# Install DDEV
brew install ddev/ddev/ddev
# One-time initialization of mkcert
mkcert -install
```

Or alternatively:

```shell
# Download and run the install script
curl -fsSL https://ddev.com/install.sh | bash
ddev start
```
## 3. Setting up the DDEV for a project

#### Set up the DDEV for your project.

Setting up the DDEV for your project as a local development environment is a little trickier than the installation. Ensure the root of your actual Drupal project, as depending on the project, it might not be in the actual root of the project, but, e.g., in a subdirectory called drupal/.

### 3.1 Steps to be taken

1. To commence, `cd` into the existing project directory. Ensure that you’re in the actual Drupal root, as this might not always be the root of the project.
2. Run `ddev config` to initialize a DDEV project.
3. Run `ddev start` to spin up the project.
4. Run `ddev launch` to launch the project in a web browser. This is the same command as `lando start` in Lando environment.

See the folder structures below for an example of a DDEV project. The project in question is Raisio.

```
client-fi-raisio/                  ← 🔹 Project root. Keep in mind that project root may be the same as Drupal root.
│
├── .circleci/
├── .github/
├── .lando/
├── .vscode/
├── docs/
│
├── drupal/                        ← 📦 Drupal root for this project (custom layout)
│   ├── .ddev/                     ← ⚙️ DDEV config folder (**must be inside Drupal root**)
│   ├── conf/                      ← (Optional project-specific config)
│   ├── config/                    ← Drupal config sync
│   ├── content/                   ← Content files (optional)
│   ├── drush/                     ← ✅ Drush config folder
│   │   └── drush.yml              ← ✅ Drush config file (e.g. preserve uids in sql-sanitize)
│   ├── files/                     ← Public files directory (sites/default/files)
│   ├── modules/
│   ├── profiles/
│   ├── themes/
│   ├── sites/                     ← Classic Drupal `sites/` folder (default, etc.)
│   ├── index.php
│   └── settings.php (within sites/default/)
│
├── README.md
└── composer.json
```

```
drupal/                     ← Drupal root
└── .ddev/                  ← ⚙️ DDEV configuration directory
    ├── .dbimageBuild/              ← (Used for custom DB image builds)
    ├── .homeadditions/             ← Host-side files added to container home directories
    ├── .webimageBuild/             ← (Used for custom web image builds)
    ├── addon-metadata/             ← Metadata for DDEV custom addons
    ├── apache/                     ← Apache config overrides (optional)
    ├── commands/                   ← Custom DDEV commands (e.g. `ddev syncdb`)
    ├── db-build/                   ← Custom provisioning scripts for db service
    ├── db.snapshots/               ← Local DB snapshot storage (if snapshots used)
    ├── homeadditions/              ← Home directory customization
    ├── mysql/                      ← MySQL/MariaDB config or init scripts
    ├── nginx_full/                 ← Nginx config for "full" site mode
    ├── php/                        ← PHP overrides (e.g. php.ini, PHP extensions)
    ├── providers/                  ← Mapping providers or CMS-specific integrations
    ├── traefik/                    ← Traefik config overrides and templates
    ├── web-build/                  ← Scripts/configs run during container build
    ├── web-entrypoint.d/           ← Commands run when the web container starts
    ├── xhprof/                     ← Optional config for performance profiling with XHProf
    │
    ├── .ddev-docker-compose-base.yaml     ← Base services (extend or override docker-compose)
    ├── .ddev-docker-compose-full.yaml     ← Full docker-compose extensions (auto-generated/used with Xdebug, etc.)
    ├── .gitignore                          ← Ensures correct exclusions in version control
    └── config.yaml                         ← 🧠 Main DDEV configuration file (project type, name, router, php_version, etc.)
```

## 4. Lando tooling -> DDEV commands

#### The DDEV commands perform the same function as the toolings in Lando. They both allow adding custom commands e.g. lando syncdb.
As DDEV is not configured in a single yaml-file, but instead in .ddev-folder, the integration of tooling is a bit different in DDEV than in Lando.


### 4.1 Commands in DDEV

The commands are located in the `.ddev`-folder's `commands` subfolder. DDEV automatically generates 3 folders where you can create commands: `db`, `host` and `web`.

```
.ddev/
└── commands/                           ← 💡 DDEV custom commands (executed via `ddev <command>`)
    ├── db/                             ← 🧠 Scoped to `ddev db <command>`
    │   └── (e.g., import-db, dump-db)
    ├── host/                           ← 💻 Executes on host (outside container)
    │   └── (e.g., pre-build steps, git utilities)
    └── web/                            ← 🌐 Executes inside web container
        └── (e.g., php testing, linting)
```

In Lando, toolings were used to execute different actions in the local development environment, e.g. Codeception tests. These toolings are placed in the .lando.yml-configuration file under the toolings section.

Below is an example of a Codeception tooling (taken from Raisio’s `.lando.yml`):

```yml
toolings:
  codeception:
    cmd:
      - appserver: "./vendor/bin/codecept --env=lando"
    description: "Run codeception tests"
    dir: "/app/drupal"
```

In DDEV, the command files are bash files. They’re marked as bash files, and their documentation consists of description, usage and example. You may also add a see part for relevant documentation, e.g. a documentation related to the said bash file.

Below is an equivalent DDEV example command for [Codeception](https://codeception.com/) tests that would be located in .ddev/commands/web/codeception.sh

```shell
#!/bin/bash
## Description: Run Codeception PHP tests
## Usage: codeception
## Example: ddev codeception

#
# Helper script to run codeception tests
#
# Usage:
# ddev codeception
# See: https://codeception.com/
#

set -eu
cd /var/www/html
./vendor/bin/codecept --env=ddev "$@"
```

### 4.2 sh-files in Lando and in DDEV

In Lando projects, there might be custom sh or bash files that contain custom commands to perform different actions, e.g. database synchronisation from the cloud environment.

In order for you to integrate these to DDEV environment, you just need to copy the sh-files from the lando folder to your DDEV commands folder. Please take a look at the next 2 example folder structures from Raisio project:

```
client-fi-raisio/
├── .circleci/
├── .github/
├── .lando/                     ← ❌ Legacy (Lando-specific, now unused with DDEV)
│   ├── sapi.sh
│   ├── syncdb.sh
│   └── xdebug.sh
│
├── drupal/                     ← Drupal root
│   └── .ddev/
│       ├── commands/
│       │   ├── host/           ← ✅ DDEV host commands executed on host machine
│       │   │   ├── syncdb
│       │   │   ├── sapi
│       │   │   └── xdebug
│       │   └── web/            ← DDEV web container commands
│       ├── config.yaml
│       └── ...
└── ...
```

These scripts may not be directly run as they were in .lando-directory. As an example, see the file **sapi** in DDEV web commands folder, as it was copied directly from .lando-directory:

```shell
#!/bin/bash
set -exu

PATH="/app/drupal/vendor/bin:$PATH"

cd /app/drupal/web

# # Rebuild the tracker for an index.
drush search-api:rebuild-tracker

# # Index all search items.
drush search-api:index
```

If you try and run `ddev sapi`, it would not run successfully, as the PATH refers to a faulty address in DDEV folder’s point of view, same applying with the cd command. Instead you should change these two addresses to match the current directory structure.

See below the fixed code for **sapi**:

```shell
#!/bin/bash
set -exu

PATH="/var/www/html/vendor/bin:$PATH"

cd /var/www/html/web

# # Rebuild the tracker for an index.
drush search-api:rebuild-tracker

# # Index all search items.
drush search-api:index
```

As we moved to a DDEV environment, the project root is bound to `/var/www/html`, not `/app`. This is why the `/app/drupal/web` was changed to `/var/www/html`, as was done in the example code. Now running `ddev sapi` will result in a successfully run shell script.

```
├── drupal/
├── host/
│   ├── README.txt
│   └── syncdb                  ← Syncdb is a special file for database synchronization. Place it under host folder.
└── web/
│   ├── ...
│   ├── sapi                    ← Move sapi.sh as sapi to web folder.
│   ├── xdebug                  ← Move xdebug.sh as xdebug to web folder.
│   └── ...
└── ...
```

You also have a file called `syncdb` that was converted into a DDEV command. It should be placed in the host folder where it can be used to synchronize the database from the remote environment with the local environment. After having placed it, you may run it via `ddev syncdb <environment>`. Usually, the environments used are either master, main or production.

Below is an example of `syncdb`:
```shell
#!/bin/bash

## Description: Synchronize local database with a remote environment using fast import
## Usage: syncdb [environment] [options]
## Example: ddev syncdb main --backup
##
## Parameters:
##   environment: 'main' (default) or 'production'
##   options:##     --help: Display help information
##     --force: Skip confirmation prompts
##     --backup: Create a backup of the local database before overwriting
##     --no-sanitize: Skip database sanitization
##
## IMPORTANT: This command only syncs FROM remote environments TO your local environment.
## It will NEVER modify remote environments as enforced by drush/Commands/PolicyCommands.php

# Set your project name here. Replace client-name with your client name, e.g. luvn, etc.
PROJECT_NAME="client-fi-<client-name>"

# Exit on error, unset variables, and enable debug output
set -eu

# Show script execution
if VERBOSE is setif [[ "${VERBOSE:-}" == "true" ]]; then
  set -x
fi

# Define colors for better output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Define temporary directory and files
TMP_DIR="/tmp"
dump_file="${TMP_DIR}/dump.sql.gz"
backup_file="${TMP_DIR}/db-backup-$(date +%Y%m%d%H%M%S).sql"

# Create temporary directory if it doesn't exist
mkdir -p "${TMP_DIR}"

# Set drush command for DDEV
DRUSH="ddev drush"

# Default options
env="main"
force=false
backup=false
sanitize=true

# Function to display help information
show_help() {
  echo "Usage:"
  echo "  ddev syncdb [environment] [options]"
  echo ""
  echo "Description:"
  echo "  Synchronize local database with a remote environment using fast import"
  echo "  Uses compressed dumps and DDEV's native import for optimal performance"
  echo ""
  echo "  environment: 'main' (default) or 'production'"
  echo "  options:"
  echo "    --help: Display this help message"
  echo "    --force: Skip confirmation prompts"
  echo "    --backup: Create a backup of the local database before overwriting"
  echo "    --no-sanitize: Skip database sanitization"
  echo ""
  echo "Examples:"
  echo "  ddev syncdb main"
  echo "  ddev syncdb production --backup"
  echo "  ddev syncdb --force --no-sanitize"
}

# Process command line arguments
while [[ $# -gt 0 ]]; do
  case "$1" in
    main|production)
      env="$1"
      ;;
    --force)
      force=true
      ;;
    --backup)
      backup=true
      ;;
    --no-sanitize)
      sanitize=false
      ;;
    --help|-h)
      show_help
      exit 0
      ;;
    *)
      echo -e "${RED}Error: Unknown option '$1'${NC}"
      show_help
      exit 1
      ;;
  esac
  shift
done

# Determine the SSH command based on the environment parameter
echo -e "${GREEN}Using environment: ${YELLOW}${env}${NC}"
if [ "$env" == "main" ]; then
  ssh_command="ssh www-admin@main-shell.${PROJECT_NAME} -J www-admin@ssh.dev.wdr.io"
elif [ "$env" == "production" ]; then
  ssh_command="ssh www-admin@production-shell.${PROJECT_NAME} -J www-admin@ssh.finland.wdr.io"
else
  echo -e "${RED}Invalid environment. Please specify 'main' or 'production'.${NC}"
  exit 1
fi

# Cleanup function to remove temporary files
cleanup() {
  echo -e "${GREEN}Cleaning up temporary files...${NC}"
  rm -f "$dump_file"
}

trap cleanup EXIT

# Test SSH connection and SSH agent status before proceeding
check_ssh_agent() {
  if ! ssh-add -l &>/dev/null; then
    echo -e "${YELLOW}No SSH agent detected or no keys loaded.${NC}"
    echo -e "${GREEN}When using DDEV, please run the following commands on your host machine:${NC}"
    echo ""
    echo "1. Start SSH agent:     eval \$(ssh-agent -s)"
    echo "2. Add your SSH key:    ssh-add ~/.ssh/id_rsa  # or your specific key path"
    echo "3. Share with DDEV:     ddev auth ssh"

    echo -e "${YELLOW}Would you like to continue anyway? (y/n)${NC}"
    read -p "" -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
      echo -e "${GREEN}Operation cancelled. Please run 'ddev auth ssh' before trying again.${NC}"
      exit 0
    fi
  fi
}

echo -e "${GREEN}Testing SSH connection to ${YELLOW}${env}${GREEN}...${NC}"
check_ssh_agent

# Test SSH connection - allow passphrase prompt to be visible
if ! $ssh_command "echo 'Connection successful'" 2>&1 | grep -q "Connection successful"; then
  echo -e "${RED}Failed to establish SSH connection to ${env}. Check your credentials and network.${NC}"
  exit 1
fi

# Confirmation before proceeding
if [ "$force" != "true" ]; then
  echo -e "${YELLOW}WARNING: This will overwrite your local database with data from ${env}.${NC}"
  read -p "Do you want to continue? (y/n) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${GREEN}Operation cancelled.${NC}"
    exit 0
  fi
fi

# Backup local database if requested
if [ "$backup" == "true" ]; then
  echo -e "${GREEN}Creating backup of local database...${NC}"
  if ! $DRUSH sql-dump > "$backup_file"; then
    echo -e "${RED}Failed to create local database backup.${NC}"
    exit 1
  fi
  echo -e "${GREEN}Local database backup created at ${YELLOW}${backup_file}${NC}"
fi

# Create a compressed database dump file
echo -e "${GREEN}Creating compressed database dump from ${YELLOW}${env}${GREEN} environment...${NC}"
if ! $ssh_command "drush sql-dump --gzip" > "$dump_file"; then
  echo -e "${RED}Failed to create database dump from ${env}.${NC}"
  exit 1
fi

# Import the dump using DDEV's fast import method
# This bypasses Drush's slow stdin processing and uses direct MySQL import
# Performance improvement: ~10x faster for large databases
echo -e "${GREEN}Importing database from ${YELLOW}${env}${GREEN} using fast import...${NC}"
if ! ddev import-db --file="$dump_file"; then
  echo -e "${RED}Failed to import database.${NC}"
  exit 1
fi

# Sanitize the database and clear caches
if [ "$sanitize" == "true" ]; then
  echo -e "${GREEN}Sanitizing database...${NC}"
  if ! $DRUSH sqlsan -y; then
    echo -e "${YELLOW}Warning: Database sanitization failed.${NC}"
  fi
fi

echo -e "${GREEN}Clearing caches...${NC}"$DRUSH cc drush$DRUSH crecho -e "${GREEN}Database sync from ${YELLOW}${env}${GREEN} completed successfully!${NC}"
```

## Sources cited:

 - **DDEV Installation.** https://docs.ddev.com/en/stable/users/install/ddev-installation/
 - **Starting a Project.** https://docs.ddev.com/en/stable/users/project/
 - **Commands.** https://docs.ddev.com/en/stable/users/usage/commands/#add-on
 - **Get started with DDEV.** https://docs.ddev.com/en/stable/
 - **Docker Installation.**  https://docs.ddev.com/en/stable/users/install/docker-installation/
