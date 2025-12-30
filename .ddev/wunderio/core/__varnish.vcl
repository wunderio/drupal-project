# NOT USED, __ prefix means it's under evaluation if to be removed.
# @see: https://github.com/wunderio/charts/blob/master/drupal/templates/varnish-configmap-vcl.yaml
# The routine when we deliver the HTTP request to the user
# Last chance to modify headers that are sent to the client
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
