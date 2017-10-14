for k in "${!Hook_params[@]}"
do
  echo "$k=${Hook_params[$k]}"
done