openssl ecparam -genkey -noout -name prime256v1 \
    | openssl pkcs8 -topk8 -nocrypt -out jwt_private.pem
openssl ec -in jwt_private.pem -pubout -out jwt_public.pem