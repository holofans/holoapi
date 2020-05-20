# HoloFans API
Platform to serve Hololive information to community tools

## Development
* Requirements
  * `docker`, `docker-compose` (local only)
* Have a `gcp-key.json` on project root
  * You may get this from your GCP Project, [under credentials](https://console.cloud.google.com/apis/credentials)
    * Create **Service Account**
    * Choose **JSON key file**, this is your `gcp-key.json`
* Copy `.env.example` into `.env`
  * Change values for your environment
* Copy `ecosystem.config.sample.js` into `ecosystem.config.js`
  * Change values for your environment
* Execute `docker-compose up` on root
  * API is then accessible through `http://localhost:2434/`

## Applications
### Client API

### Cralwer: YouTube

### Cralwer: BiliBili


## Production Deployment

Set up deployment of holotools-api by using the following deployment methods:

- [HEROKU Automatic Deployment](https://devcenter.heroku.com/articles/github-integration#automatic-deploys) using a [Procfile](https://devcenter.heroku.com/articles/preparing-a-codebase-for-heroku-deployment#3-add-a-procfile)
- [Digital Ocean Deployment](https://www.digitalocean.com/community/tutorials/how-to-set-up-automatic-deployment-with-git-with-a-vps)
  - or if you'd rather not deploy from local, and would like it semi-automated, use a webhook: https://github.com/adnanh/webhook

### Digital Ocean

Setting up a dev user account
```
    $  adduser holotools
    $  usermod -aG sudo holotools
    $  rsync --archive --chown=holotools:holotools ~/.ssh /home/holotools
```

Setting up postgresql
```
    $  sudo apt update && sudo apt install postgresql postgresql-contrib
    $  sudo -i -u postgres

    #  Create a new user in postgres with same username as the dev user (holotools):
    $  createuser --interactive

    #  Set it up with the holotools user.
    $  createdb holotools
```

Now you have `holotools` user which can modify `holotools` database without pg auth.

For testing connections from outside, modify the pg_hba.conf for your postgres install:
```
host    all             all             127.0.0.1/32            trust
``` 
change the pg_hba.conf for localhost (127.0.0.1/32) from `md5` to `trust` to give pg permissions. This allows SSH tunneling to log in to postgres.

To connect to postgres from external: set up SSH tunnel `-L 9999:localhost:5432` or, use SSH-tunnel connection option bundled with any db administration tools (tableplus, pgAdmin4). Then use `holotools` user to log in. No db password is needed in this setup, but don't open up the db to external or security issues may arise.


Installing Memcached: [Detailed Guide](https://www.digitalocean.com/community/tutorials/how-to-install-and-secure-memcached-on-ubuntu-16-04)
```
$ sudo apt-get install memcached
$ sudo apt-get install libmemcached-tools
```
This sets up memcached service at localhost:11211, well, it's not daemonized.
