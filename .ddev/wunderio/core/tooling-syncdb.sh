#!/bin/bash

#
# Synchronise local database with the production environment.
#
# Based on https://github.com/wunderio/unisport/blob/master/.lando/syncdb.sh
#

set -eu
if [[ -n "${WUNDERIO_DEBUG:-}" ]]; then
    set -x
fi
export PATH=/bin:/sbin:/usr/bin:/usr/sbin:/usr/local/bin

source .ddev/wunderio/core/_helpers.sh

sql_file="prod-syncdb-$(date +'%Y-%m-%d').sql"

# Read the production alias from the drush configuration.
# For some reason "ddev drush sql-sync @prod @local -y" does not work and times out.
prod_alias=$(ddev drush sa @prod)
prod_ssh_user=$(echo "$prod_alias" | ddev yq '.\"@self.prod\".user' )
prod_ssh_options=$(echo "$prod_alias" | ddev yq '.\"@self.prod\".ssh.options' )
prod_ssh_host=$(echo "$prod_alias" | ddev yq '.\"@self.prod\".host' )

set -x
ssh "$prod_ssh_user@$prod_ssh_host" "$prod_ssh_options" "drush sql-dump --structure-tables-list=cache,cache_*,history,search_*,sessions" > "$sql_file"
ddev import-db --file="$sql_file"
rm "$sql_file"
{ set +x; } 2>/dev/null

display_status_message "Sync complete!"
