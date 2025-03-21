#!/bin/bash

# Exit if no plugins specified
[ -z "$ELASTICSEARCH_PLUGINS" ] && echo "No plugins specified in ELASTICSEARCH_PLUGINS" && exit 0

echo "Installing Elasticsearch plugins: $ELASTICSEARCH_PLUGINS"
needs_restart=false

# Process each plugin
for plugin in $ELASTICSEARCH_PLUGINS; do
    # Skip if already installed
    if bin/elasticsearch-plugin list | grep -q "$plugin"; then
        echo "✓ Plugin $plugin already installed"
        continue
    fi

    # Install plugin
    echo "Installing $plugin plugin..."
    bin/elasticsearch-plugin install "$plugin" && \
    chown -R elasticsearch:root "/usr/share/elasticsearch/plugins/$plugin" && \
    chmod -R 755 "/usr/share/elasticsearch/plugins/$plugin" && \
    echo "✓ Plugin $plugin installed successfully" && \
    needs_restart=true
done

# Signal for restart if needed
[ "$needs_restart" = true ] && echo "New plugins were installed. Elasticsearch needs to be restarted." && touch /tmp/elasticsearch_needs_restart

exit 0
