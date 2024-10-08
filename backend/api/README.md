# CRCT API

## Dev

clone the repo

It will require a .env file containing the following variables:
```
AWS Public Key
AWS Secret Key
```

Then to start docker run this: 

```
docker run -d -p 8000:8000 --env-file .env fastapi-app
```

