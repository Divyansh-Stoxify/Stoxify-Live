#/bin/bash

TARGET_SERVER=$1
API_PORT=$2

attempts=10
for ((i = 1; i <= attempts; i++)); do
  curl_status=$(curl -s -o /dev/null -w "%{http_code}" http://$TARGET_SERVER:$API_PORT)
  if [ "$curl_status" = "200" ]; then
    echo "App is up!"
    exit 0
  else
    echo "Attempt $i: App is not yet up. Retrying in 10 seconds..."
    sleep 10
  fi
done

# If all attempts fail, exit with failure code
echo "All attempts failed. App is not up."
exit 1