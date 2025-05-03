# For a more advanced example see https://github.com/mattiasgeniar/varnish-6.0-configuration-templates
vcl 4.1;
import std;

# Define an ACL for trusted purge clients
acl purge {
  "127.0.0.1";
  "::1";
  "web";
}

backend default {
  .host = "web";
  .port = "80";
}

# @see: https://github.com/wunderio/charts/blob/master/drupal/templates/varnish-configmap-vcl.yaml
# The routine when we deliver the HTTP request to the user
# Last chance to modify headers that are sent to the client.
sub vcl_deliver {
  # Called before a cached object is delivered to the client.

  # Add debug header to see if it's a HIT/MISS and the number of hits, disable when not needed.
  if (obj.hits > 0) {
    set resp.http.X-W-Cache = "HIT";
    set resp.http.X-W-Cache-Hits = obj.hits;
  } else {
    set resp.http.X-W-Cache = "MISS";
  }
}

sub vcl_recv {
  if (std.port(server.ip) == 8025) {
    return (synth(750));
  }

  # Handle PURGE requests for Drupal's varnish_purger module
  if (req.method == "PURGE") {
    # Allow PURGE requests from trusted clients only
    if (!client.ip ~ purge) {
      return (synth(403, "Access denied."));
    }

    # Purge by Cache-Tags header
    if (req.http.Cache-Tags) {
      ban("obj.http.Cache-Tags ~ " + req.http.Cache-Tags);
      return (synth(200, "Purge executed."));
    }

    # For URL-based purging
    return (hash);
  }

  # Handle BAN requests for Drupal's cache tags
  if (req.method == "BAN") {
    # Allow BAN requests from trusted clients only
    if (!client.ip ~ purge) {
      return (synth(403, "Access denied."));
    }

    # Ban by Cache-Tags header (sent by Drupal's varnish_purger module)
    if (req.http.Cache-Tags) {
      ban("obj.http.Cache-Tags ~ " + req.http.Cache-Tags);
      return (synth(200, "Ban added."));
    }

    return (synth(403, "Invalid ban request"));
  }
}

sub vcl_hit {
  if (req.method == "PURGE") {
    # We found the object in cache, now invalidate it
    set req.http.X-Purge-URL = req.url;
    set req.http.X-Purge-Host = req.http.host;
    return (synth(200, "Purged " + req.url));
  }
}

sub vcl_miss {
  if (req.method == "PURGE") {
    # Object not in cache, but we still respond with a success
    set req.http.X-Purge-URL = req.url;
    set req.http.X-Purge-Host = req.http.host;
    return (synth(200, "Purged " + req.url + " (not in cache)"));
  }
}

sub vcl_synth {
  if (resp.status == 750) {
    set resp.status = 301;
    set resp.http.location = req.http.X-Forwarded-Proto + "://novarnish." + req.http.Host + req.url;
    set resp.reason = "Moved";
    return (deliver);
  }
}

# Store the Cache-Tags header from backend responses
sub vcl_backend_response {
  if (beresp.http.Cache-Tags) {
    set beresp.http.Cache-Tags = beresp.http.Cache-Tags;
  }
}
