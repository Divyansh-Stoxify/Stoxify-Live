#!/bin/bash
# NOTE: Replace the subnet prefixes below (10.0.100. / 10.0.120.) with the
# subnet(s) your own VPN assigns. These are placeholders from the original repo.
# If you don't deploy through a VPN, delete this script and the VPN steps in deploy.yaml.
retry_count=0
max_retries=5
while [ $retry_count -lt $max_retries ]; do
  if ip addr show | grep 'inet 10.0.100.'; then
    echo "OpenVPN connection is established (VPN 1)."
    exit 0
  elif ip addr show | grep 'inet 10.0.120.'; then
    echo "OpenVPN connection is established (VPN 2)."
    exit 0
  else
    echo "OpenVPN connection not established yet, retrying..."
    ((retry_count++))
    sleep 5
  fi
done
echo "ERROR: OpenVPN connection not established after $max_retries retries."
exit 1