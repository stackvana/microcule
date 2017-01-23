open Printf;;
Hashtbl.iter (fun k v -> printf "%s: %s\n" k v) hook_params;