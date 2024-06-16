## 🎛️ Setting up enviroment

**1. You need to register a database (If you don't want to use connection db or already have installed MongoDB or MySQL above, skip this step)**
> * If you want to use MongoDB, register this page [512mb]: https://www.mongodb.com/cloud/atlas/register
> * If you want to use MySQL, you can check this free register [5mb]: https://www.freemysqlhosting.net

## 💾 Database (If you nether use MongoDB nor MySQL, skip this step)
#### 🍃 MongoDB
**-------------------- Local --------------------**
> * After you install `MongoDB`, open `MongoDBCompass`
> * Click on `Save and Connect`
> * Give it a name
> * After that, you copy the connection string (you will need this later)

**-------------------- MongoDB Atlas --------------------**
> * After done every register, go to `network access`
> * Click `Add IP address`
> * In `Access List Entry` field, add this IP address `0.0.0.0/0` (This will allow connect to every devices. If you don't want, you can skip this step or add your devices IP)
> * After that, click on Save
> * Then, click back to `Overview`
> * Now, click on `Connect` button
> * In here, click on `Drivers` button
> * Scroll down and copy the connection string (Note: Replace `<password>` with your user password, do not include `<>`)
> * After you copy the connection string, save it for later. You will need this later

#### 🐬 MySQL
**-------------------- Local --------------------**
> * After you install `MySQL`, go to cmd
> * Type: `mysql -u root -p`
> * Type your password
> * After that, use this command to create your database: `CREATE DATABASE <your_db_name>;` (Note: Replace `<your_db_name>` with your name whatever you want, do not include `<>`)
> * Then, save the db name for use later

**-------------------- www.freemysqlhosting.net --------------------**
> * After done every register, go to `MySQL Hosting`
> * Follow their introduction and click `Complete my registration`
> * Click `Start new database` (This will take a while for their setting up)
> * If you follow correctly, they will send your email with their credentials
> * Save that for later use.