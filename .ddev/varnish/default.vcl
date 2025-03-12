# For a more advanced example see https://github.com/mattiasgeniar/varnish-6.0-configuration-templates
vcl 4.1;
import std;

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
}

sub vcl_synth {
  if (resp.status == 750) {
    set resp.status = 301;
    set resp.http.location = req.http.X-Forwarded-Proto + "://novarnish." + req.http.Host + req.url;
    set resp.reason = "Moved";
    return (deliver);
  }
}
