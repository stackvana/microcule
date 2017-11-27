# bash 4 is required for Hook_params nested object
for k in "${!Hook_params[@]}"
do
  echo "$k=${Hook_params[$k]}"
done

# with bash 3 properties are accessed using the syntax:
echo $Hook_params_foo;
# where "foo" is the name of the http request parameter