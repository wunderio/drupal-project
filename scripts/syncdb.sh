#!/bin/bash
# syncdb.sh - Synchronize local database with a remote environment
# Usage:
#   ./scripts/syncdb.sh [environment] [options]
#   lando syncdb [environment] [options]
#
# Parameters:
#   environment: 'main' (default) or 'production'
#   options:
#     --force: Skip confirmation prompts
#     --backup: Create a backup of the local database before overwriting
#     --no-sanitize: Skip database sanitization

# Set your project name here - this should be updated during project setup
PROJECT_NAME="drupal-project"

# Exit on error, unset variables, and enable debug output
set -eu

# Show script execution if VERBOSE is set
if [[ "${VERBOSE:-}" == "true" ]]; then
  set -x
fi

# Define colors for better output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if running inside a container
if [ -f "/.dockerenv" ] || [ -f "/run/.containerenv" ]; then
  IN_CONTAINER=true
else
  IN_CONTAINER=false
fi

# Define temporary directory and files
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
if [ "$IN_CONTAINER" = true ] && [ -d "/app" ]; then
  # When running inside container, force use of /app path
  PROJECT_ROOT="/app"
else
  # When running from host, determine relative path
  PROJECT_ROOT="$( cd "${SCRIPT_DIR}/.." && pwd )"
fi

TMP_DIR="${PROJECT_ROOT}/tmp"
dump_file="${TMP_DIR}/dump.sql"
processed_dump_file="${TMP_DIR}/dump-processed.sql"
backup_file="${TMP_DIR}/db-backup-$(date +%Y%m%d%H%M%S).sql"

# Create temporary directory if it doesn't exist
mkdir -p "${TMP_DIR}"

# Determine which local environment we're using and set the appropriate drush command
if [ "$IN_CONTAINER" = true ]; then
  # If we're already inside a container, use drush directly
  echo -e "${GREEN}Running inside container, using 'drush' directly${NC}"
  DRUSH="drush"
elif command -v ddev >/dev/null 2>&1 && [ -f "${PROJECT_ROOT}/.ddev/config.yaml" ]; then
  echo -e "${GREEN}Detected DDEV environment, using 'ddev drush'${NC}"
  # Check if DDEV is running
  if ! ddev status >/dev/null 2>&1; then
    echo -e "${YELLOW}DDEV is not running. Starting DDEV...${NC}"
    ddev start
  fi
  DRUSH="ddev drush"
elif command -v lando >/dev/null 2>&1 && [ -f "${PROJECT_ROOT}/.lando.yml" ]; then
  echo -e "${GREEN}Detected Lando environment, using 'lando drush'${NC}"

  # Check if Lando is running
  if ! lando list 2>/dev/null | grep -q "RUNNING"; then
    echo -e "${YELLOW}Lando is not running. Would you like to start it now? (y/n)${NC}"
    read -p "" -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
      echo -e "${GREEN}Starting Lando...${NC}"
      lando start
    else
      echo -e "${RED}Cannot proceed without Lando running. Please start Lando with 'lando start' and try again.${NC}"
      exit 1
    fi
  fi

  DRUSH="lando drush"
else
  echo -e "${YELLOW}No container environment detected, using 'drush' directly${NC}"
  DRUSH="drush"
fi

# Default options
env="main"
force=false
backup=false
sanitize=true

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
    *)
      echo -e "${RED}Error: Unknown option '$1'${NC}"
      echo "Usage:"
      echo "  ./scripts/syncdb.sh [environment] [options]"
      echo "  lando syncdb [environment] [options]"
      echo ""
      echo "  environment: 'main' (default) or 'production'"
      echo "  options:"
      echo "    --force: Skip confirmation prompts"
      echo "    --backup: Create a backup of the local database before overwriting"
      echo "    --no-sanitize: Skip database sanitization"
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
    rm -f "$dump_file" "$processed_dump_file"
}
trap cleanup EXIT

# Test SSH connection before proceeding
echo -e "${GREEN}Testing SSH connection to ${YELLOW}${env}${GREEN}...${NC}"
if ! $ssh_command "echo 'Connection successful'" > /dev/null 2>&1; then
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
    cd "${PROJECT_ROOT}/web"
    if ! $DRUSH sql-dump > "$backup_file"; then
        echo -e "${RED}Failed to create local database backup.${NC}"
        exit 1
    fi
    echo -e "${GREEN}Local database backup created at ${YELLOW}${backup_file}${NC}"
fi

# Create a database dump file
echo -e "${GREEN}Creating database dump from ${YELLOW}${env}${GREEN} environment...${NC}"
if ! $ssh_command "drush sql-dump" > "$dump_file"; then
    echo -e "${RED}Failed to create database dump from ${env}.${NC}"
    exit 1
fi

# Process the dump file to handle MariaDB compatibility
echo -e "${GREEN}Processing dump file...${NC}"
# @see: https://mariadb.org/mariadb-dump-file-compatibility-change.
tail -n +2 "$dump_file" > "$processed_dump_file"

# Import the processed dump
echo -e "${GREEN}Importing database from ${YELLOW}${env}${GREEN}...${NC}"
cd "${PROJECT_ROOT}/web"
if ! $DRUSH sql-drop -y; then
    echo -e "${RED}Failed to drop local database.${NC}"
    exit 1
fi

if ! $DRUSH sqlc < "$processed_dump_file"; then
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

echo -e "${GREEN}Clearing caches...${NC}"
$DRUSH cc drush
$DRUSH cr

echo -e "${GREEN}Database sync from ${YELLOW}${env}${GREEN} completed successfully!${NC}"
