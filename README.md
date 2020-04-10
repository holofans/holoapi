# holotools-api
Monolith tools and services in consuming Hololive content


## development

## deployment

Set up deployment of holotools-api by using the following deployment methods:

- [HEROKU Automatic Deployment](https://devcenter.heroku.com/articles/github-integration#automatic-deploys) using a [Procfile](https://devcenter.heroku.com/articles/preparing-a-codebase-for-heroku-deployment#3-add-a-procfile)
- [Digital Ocean Deployment](https://www.digitalocean.com/community/tutorials/how-to-set-up-automatic-deployment-with-git-with-a-vps)
  - or if you'd rather not deploy from local, and would like it semi-automated, use a webhook: https://github.com/adnanh/webhook


## deployment setup on Digital Ocean

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

    Create a new role:
    $  createuser --interactive
    and set it up with the holotools user.
    $  createdb holotools
    and connect the holotools user to access the holotools db.
```

Now you have `holotools` user which can modify `holotools` database.

For testing connections from outside:
```
host    all             all             127.0.0.1/32            trust
``` 
change the pg_hba.conf for postgres from `md5` to `trust` to give pg permissions. This allows SSH tunneling to log in to postgres.

Connection instructions: set up SSH tunnel using your ssh-key or it can come with any db administration tools (tableplus, pgAdmin4). Then use `holotools` user to log in.
