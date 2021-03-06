# Docker and Kubernetes: The complete guide

## Section 1: Introduction

### The Docker ecosystem

Docker is an ecosystem for creating and running **containers**

The Docker ecosystem consists of:

- Docker **Client** (CLI)
- Docker **Server** (Daemon)
- Docker **Machine**
- Docker **Images**
- Docker **Hub**
- Docker **Compose**

An **Image** is a single file with all dependencies & configuration that is required to run a program.

A **Container** is an instance of an image. A container runs a program.

The docker **Client** (or CLI) allowed to interact with the **Docker Server** (or Daemon) using commands in order to
create images and run containers.

The `run` command starts a new container based on an image.

```bash
$ docker run hello-world
```

if a local copy of the image doesn't exist in the local cache of images, a new copy will be pull from the server and
will be instantiated.

### What is a container?

Before talking about containers we should take a brief overview of an OS structure:

![OS](./diagrams/01/kernel.png)


#### Namespacing and Control groups

**Namespacing** is the process of isolating resources per process (or group of processes). 

For example:

- Processes
- Hard drive
- Network
- Users
- Hostnames
- Inter Process Communication

**Control groups** can be used to limit the amount of resources per process

For example:

- Memory
- CPU usage
- HD I/O
- Network Bandwidth

Namespacing and control groups are features specific to **Linux**, when installing docker on mac or windows, a **Linux**
VM is installed in the background.

![contToImage](./diagrams/01/stack.png)

When referring to the **container** we are essentially referring to the running process (e.g. chrome, nodeJS) 
**as well as** the segment of resources that it can talk to.

An image holds a "File System Snapshot" and a startup command.

When we "turn" an image into a container, the kernel will isolate a section of the hard drive and make it available to 
just this container, and the FS snapshot is copied into that segment of the HD. 

![contToImage](./diagrams/01/cont_to_image.png)


## Section 2 : Manipulating Containers with the Docker Client

A closer look into some of the docker commands and their output:

- `docker run <image_name> <startup_command>` - runs a container
    
    + `docker run` == `docker create` + `docker start`
    
    - **image_name** - the name of the image to run
    - **startup_command** - a command that is executed when the container starts up (overrides the default stratup command) 
    
    ```bash
    $ docker run busybox ls
    bin
    dev
    etc
    home
    proc
    root
    sys
    tmp
    usr
    var
    ```
    
    *note*: the busybox image has the `ls` and `echo` executables in its file system snapshot.
    
- `docker ps` - lists all running containers (adding `--all` will list also non running containers)
    
    ```bash
    $ docker ps --all
    CONTAINER ID        IMAGE               COMMAND             CREATED             STATUS                      PORTS               NAMES
    e198d4f2d08c        busybox             "ls"                10 minutes ago      Exited (0) 10 minutes ago                       infallible_dewdney
    70948c878d0c        busybox             "echo bye there"    10 minutes ago      Exited (0) 10 minutes ago                       zen_dhawan
    ec854374d371        busybox             "echo hi there"     11 minutes ago      Exited (0) 11 minutes ago                       inspiring_curran
    d704d40927ae        hello-world         "/hello"            2 hours ago         Exited (0) 2 hours ago                          hopeful_poincare
    ```

    a common use of the `ps` command is to find the id of a specific container.

-  `docker create <container_name>` - create a container
    
    ```bash
    $ docker create hello-world
    38734cc4663f2704e528442a21ecfa342f113ef2de36dd934aaf28cd33dd78fd
    ```
    **note**: The id on the created container is printed out

    * When a container is created, the file system snapshot it set up.

- `docker start -a <container_id>`
    
    **notes**: 

    - the `-a` flag makes docker watch for output from within the container and print it out to the local terminal

    - When a container starts, it means actually running the startup command.
    
    - When a container is *Exited*, it can be started back up by calling `dcoker start <container_id>`.

- `docker system prune` - deletes stopped containers and build cache (with all the images downloaded from docker hub).

- `docker logs <container_id>` - getting all of the output from a container.

    **note** the docker logs does **not** rerun the container.

- `docker stop <container_id>` - stop a running container by issueing a `SIGTERM` command (clean shutdown with cleanup)

- `docker kill <container_id>` - stop a running command by issuing a `SIGKILL` command (shuts down immediately without cleanup)

In many cases we might want to start another process inside an already running container. 
For example `redis-cli` needs to interact with redis server in order to work.
To do so, we will make use of the `exec` command

 - `docker exec -it <container_id> <command>` - execute a command inside a running container.
    
    - The **-it** flag allows to provide input to the container.
    - `-i` attaches the terminal to the `STDIN` channel of the running process
    - `-t` makes sure that all the text is nicely formatted

    ```bash
    $ docker ps
    CONTAINER ID        IMAGE               COMMAND                  CREATED             STATUS              PORTS               NAMES
    70dcaacef58a        redis               "docker-entrypoint.s…"   6 minutes ago       Up 6 minutes        6379/tcp            pensive_dijkstra
    $ docker exec -it 70dcaacef58a redis-cli
    127.0.0.1:6379> set myvalue 3
    OK
    127.0.0.1:6379> get myvalue
    "3"
    ```

    Often times we would want to gain terminal or shell access to the running container:

    - `docker exec -it <container_id> sh` - opens the shell of the container
    
    **note**: `sh` is a program which is a command processor or a shell.

***Linux Sidenote***:

Every process in a linux environment has 3 communication channels: `STDIN`, `STDOUT` & `STDERR` attached to it, which are used to communicate information either into or out of a process.

`STDIN` is used to communicate into the process. the stuff we type in the terminal is being directed into a running `STDIN` channel attached to a process

`STDOUT` conveys information coming out of the process.

`STDERR` conveys information coming out of the process that is "error in nature"

![stdin](./diagrams/02/stdin.png)


***Important note***: 2 containers **do not** automatically share the same file system. In order for 2 containers to share the same file system we need to specifically form up a connection between them.


## Section 3 - Building Custom Images Through Docker Server

Building a custom image is done by creating a `Dockerfile` and writing some configuration into it which will define how the container should behave.

The `Dockerfile` is sent to the docker server via the docker client which will then build a usable image.

### The general flow a Dockerfile

1. Specify a **base image**:    
2. Run some commands to install additional programs 
3. Specify a command to run on startup.

### The general structure of a Dockerfile

```
[INSTRUCTION] [ARGUMENTS]
[INSTRUCTION] [ARGUMENTS]
.
.
.
[INSTRUCTION] [ARGUMENTS]
``` 

### Practical Example: Create an image that runs redis-server:

Dockerfile: 

```docker
# Use an existing docker image as a base
FROM alpine

# Download and install a dependency
RUN apk add --update redis

# Tell the image what to do when it starts as a container
CMD ["redis-server"] 
```

and then:
```bash
$ docker build .
...
Successfully built ab5846e5b220

$ docker run ab5846e5b220
...
1:M 21 Dec 13:06:48.603 * Ready to accept connections
```

### Breaking down the Dockerfile commands

- `FROM`: specify the docker image we want to use as a base
- `RUN`: execute some command while preparing the custom image
- `CMD`: specify what should be executed when the image is used to startup a new container

### What is Alpine? What is `apk`?

Alpine is an image that includes a default set of programs that are useful for installing and running redis.

In this case the useful command we used to create redis was `apk` (a package manager program)

### The build process in detail

`docker build <build_context>`

The *build context* is the set of files and folders that belong to our project.

1. `FROM alpine` 
    
    - downloaded the alpine image from docker hub
    
    ```bash
    Step 1/3 : FROM alpine
    latest: Pulling from library/alpine
    cd784148e348: Pull complete
    Digest: sha256:e1d4a235da8e7700f5f31d9f7130954b8cf64403e05f8fbb460cef138d90b2b3
    Status: Downloaded newer image for alpine:latest
     ---> 3f53bb00af94
    ```

2. `RUN apk add --update redis`
    
    - looked at the previous command in the Dockerfile (`FROM apline`)
    
    - took the image that was create in the previous step and created a new temporary container from that image
    
    - executed the command `apk add --update redis` as a process inside the temporary container 
    
    - stopped the temp. container
    
    - took a file system snapshot of the temp. container and save it as a temporary image.
    
    ```bash
    Step 2/3 : RUN apk add --update redis
     ---> Running in c7fccebec517
    fetch http://dl-cdn.alpinelinux.org/alpine/v3.8/main/x86_64/APKINDEX.tar.gz
    fetch http://dl-cdn.alpinelinux.org/alpine/v3.8/community/x86_64/APKINDEX.tar.gz
    (1/1) Installing redis (4.0.11-r0)
    Executing redis-4.0.11-r0.pre-install
    Executing redis-4.0.11-r0.post-install
    Executing busybox-1.28.4-r2.trigger
    OK: 6 MiB in 14 packages
    Removing intermediate container c7fccebec517
     ---> 8e04e07cfa8f
    ```   

3. `CMD ["redis-server"]`
    
    - look at the image from the previous step
    
    - create a new temporary container out of it
    
    - tells the container that its primary command should be `redis server`
    
    - shuts down the intermediate container
    
    - takes a snapshot of the file system and its primary command, and saves it as an image  
    
    ```bash
    Step 3/3 : CMD ["redis-server"]
     ---> Running in 4f897d0f2bc3
    Removing intermediate container 4f897d0f2bc3
     ---> ab5846e5b220
    Successfully built ab5846e5b220
    ```

![process](./diagrams/03/process.png)

### Rebuilds with Cache

Whenever we run a series of commands in the Dockerfile that have already been run the past, docker will use the cached 
images to run these commands again (unless the cache is cleaned with `docker system prune`).

If a new command has been added to the docker file, or the order o previous commands have chamged, then docker will 
create a new container and image, and also save that image to the cache.

### Tagging an image

An easier way to refer to an image (instead of copying and pasting long ids), is to give custom names to the image.

`docker build -t <tag_name> <build_context>`

The convention for image tags is: 
`<docker_id>/<project_name>:<version>`

for example:
`docker build -t erant10/redis:latest .`

### Manual image generation with docker commit

- installing redis on the alpine image:
    
    ```bash
    $ redis-image docker run -it alpine sh
    / # apk add --update redis
    fetch http://dl-cdn.alpinelinux.org/alpine/v3.8/main/x86_64/APKINDEX.tar.gz
    fetch http://dl-cdn.alpinelinux.org/alpine/v3.8/community/x86_64/APKINDEX.tar.gz
    (1/1) Installing redis (4.0.11-r0)
    Executing redis-4.0.11-r0.pre-install
    Executing redis-4.0.11-r0.post-install
    Executing busybox-1.28.4-r2.trigger
    OK: 6 MiB in 14 packages
    ```

- specifying the default command on startup:

    ```bash
    $ redis-image docker ps
    CONTAINER ID        IMAGE               COMMAND             CREATED              STATUS              PORTS               NAMES
    9fde27d4a817        alpine              "sh"                About a minute ago   Up About a minute                       pensive_torvalds
    $ redis-image docker commit -c 'CMD ["redis-server"]' 9fde27d4a817
    sha256:75e8685b60934463d0af9c280e12fb4b4ba555beec29c57f38db54a2d067e509
    ```

- running the newly created container:

    ```bash
    $ redis-image docker run 75e8685b6093446
    .
    .
    .
    Ready to accept connections
    ```


## Section 4 - A real project with Docker

We will create a simple web app with nodeJS, purposely making some common mistakes along the way.

**index.js**

```js
const express = require('express');

const app = express();
const port = 8080;
app.get('/', (req,res) => {
    res.send('Hi there!');
});

app.listen(port, () => {
   console.log(`listening on port ${port}`);
});
```

**Dockerfile**

```dockerfile
# Specify a base image
FROM alpine

# Install some dependencies
RUN npm install

# Default command
CMD ["npm", "start"]
```

### Alpine

The *alpine* image is **very** lightweight and it contains only a few basic unix programs and it does **not** include 
node and npm.

In general, alpine is a term in the docker world for an image that is as small and compact as possible. Many popular 
repositories will offer an alpine version of their image. 

Usually images in the docker hub has multiple versions with certain additions to the base image. to use those 
versions we just need to add a tag to the `FROM` command in the `Dockerfile`

#### Mistake 1

Running `docker build .` will throw the error: `/bin/sh: npm: not found`

There are 2 possible solutions:

1. Find a different image that has npm pre-installed (from docker hub).

2. build our own image from scratch

**Solution**

We will use the node image

**Dockerfile**

```dockerfile
FROM node:alpine
RUN npm install
CMD ["npm", "start"]
```

#### Mistake 2

`package.json` is not available inside the container:

```
npm WARN saveError ENOENT: no such file or directory, open '/package.json'
```

The only files that are available are the ones that came with the FS snapshot from the node image.

In general, when we build an image, none of the files inside of the project directory are available within the container
by default unless we **specifically allow it** inside the `Dockerfile`.

**Solution**

The `COPY` instruction is used to move files and folders from our local machine to the file system that is created in 
the container.

**Dockerfile**

```dockerfile
FROM node:alpine
COPY ./ ./
RUN npm install
CMD ["npm", "start"]
```

At this point we were able to create the image successfully.

```
Sending build context to Docker daemon  4.096kB
Step 1/4 : FROM node:alpine
 ---> ebbf98230a82
Step 2/4 : COPY ./ ./
 ---> Using cache
 ---> 5ac48dfbdef2
Step 3/4 : RUN npm install
 ---> Using cache
 ---> 0e68c7ddf32c
Step 4/4 : CMD ["npm", "start"]
 ---> Using cache
 ---> da9b25e9a84a
Successfully built da9b25e9a84a
Successfully tagged erant10/simpleweb:latest
```

#### Mistake 3

By default, no traffic that is coming into the local network is routed into the container, which has its own **isolated** 
set of ports that can receive traffic.  

Therefore at this point we cannot make any requests to the express server that is listening within the container.

**Solution**

In order to make sure that any request from outside will be redirected into the container, we need to set up an explicit
**port mapping**.

This is not done inside the `Dockerfile`, because it is a **runtime constraint**, which can only be changed when 
running a container.

The syntax to port mapping:

```bash
docker run -p <localhost_incoming_requests_port>:<port_inside_the_container> <image_name> 
```

in our case:

```bash
docker run -p 8080:8080 erant10/simpleweb
```

#### Mistake 4

It is considered bad practice to set up the project inside the image's root directory (since it might cause conflicts 
with system directories).

**Solution**

Change the Dockerfile with the `WORKDIR <project_folder>` instruction.

Any commands/instructions following the `WORKDIR` command will be executed relative to the specified folder

**Dockerfile**

```dockerfile
FROM node:alpine
WORKDIR /usr/app
COPY ./ ./
RUN npm install
CMD ["npm", "start"]
```


##### Note - unnecessary rebuilds

Any time we modify the source files, they will **not** be automatically applied to the project inside the container.

If we want to **automatically** update the file inside the container we will have to change some configuration (which 
we will do later).

Another option is to rebuild the container and restart the express server, however this means that every change we make 
to the express server files, the `COPY` instruction will be executed again (since it cannot use a cached version), 
and then `RUN npm install` again, which will install all the dependencies over and over. 

We can avoid this by splitting the **COPY** instruction into 2, first copying **only** the `package.json` file and then
the rest of the source files:

```dockerfile
FROM node:alpine
WORKDIR /usr/app
COPY ./package.json ./
RUN npm install
COPY ./ ./
CMD ["npm", "start"]
```


## Section 5 - A more complicated application

### App Overview

Overview: we want to create a docker container that contains a web application that displays the number of times that 
the server has been visited.

We will make use of 2 components for this app:
 
 - Node JS App - the infrastructure and logic of the app
 
 - Redis - the DB in which to store the number of visits

A possible approach would be to create a container for both components, however that is not a good idea when dealing 
with increasing traffic.

Traditionally we would **not** want to create multiple instances of a redis instance for a single app, instead, we 
would want to create a single instance, and when we will want to scale, we will just scale up the node server and 
make additional instances for it.
  
**index.js**

```js
const express = require('express');
const redis = require('redis');
const port = 8081;

const app = express();
const client = redis.createClient();
client.set('visits', 0);

app.get('/', (req,res) => {
    client.get('visits', (err,visits) => {
        res.send('Number of visits is ' + visits);
        client.set('visits', parseInt(visits) + 1)
    });
});

app.listen(port, () => {
    console.log('listening on port ' + port)
});
```


**Dockerfile**

```dockerfile
FROM node:alpine

WORKDIR '/app'

COPY package.json .
RUN npm install
COPY . .

CMD ["npm","install"]
```

We need to setup some network infrastructure so that the node container may communicate with Redis.

To do so, we can make use of the docker CLI, but that is not ideal since we have to re-run different commands every time
we startup the containers. Which is  why we will make use of **Docker Compose**.

### Docker Compose

Docker Compose is a CLI tool **separate to Docker** which automates some long-winded arguments we were passing to 
`docker run`. One of the big purposes of Docker Compose is that it makes it very easy to start multiple docker
containers at the same time and automatically connect them together with some form of networking.

We will create the `docker-compose.yml` which will contain some options that we would normally pass to docker CLI. 
These options will eventually be parsed and translated to the long `docker run` command.

* Docker-world side note: The term `services` is commonly used as a **type of container**.

**docker-compose.yml**

```yaml
version: '3'

services:
  # create the 'redis' service (container)
  redis-server:
    # use the image 'redis' to create this service
    image: 'redis'

  # create the 'node-app' service (container)
  node-app:
    # use the Dockerfile in the current directory to create the 'node-app' service (container)
    build: .
    # specify the ports that we want to open
    ports:
      # connect port 8081 on the local machine to the port 8081 inside the container
      - "4001:8081"
```

*note:* by using docker-compose to create the 2 containers, they will automatically have free access to one another 
and can exchange as much information as they want.

We can now use the name of the redis service to specify the redis "host" inside the `createClient`:

**index.js**

```js
// ...
const client = redis.createClient({
    host: 'redis-server',
    port: 6379 // default redis port
});
// ...
```

#### Docker compose commands

- `docker-compose up`: start an image. 
    
    equivalent to:
    
    ```bash
    docker run myimage
    ```

- `docker-compose up --build`: rebuild and start an image.
    
    equivalent to:
    
    ```bash
    docker build .
    docker run myimage
    ```
    
    We would use the `--build` flag whenever we make any changes to the app.

- `docker-compose up -d`: Launch containers in background.

- `docker-compose down`: Stop all containers.

- `docker-compose ps`: Print out the status of the containers inside of the docker-compose file (must be run from where
the docker-compose is available).

#### Docker-compose Restart Policy

In case one of our containers crash, we might want to automatically restart them.

*Side note about exit status codes*:
    - status code 0 means we exited the process as intended (everything is OK).
    - status code > 0 (1,2,3,...) means that we exited and something went wrong.    

useful restart policies:

- `"no"`: Never attempt to restart this container if it stops or crashes (the default policy).

- `always`: If this container stops **for any reason**, always attempt to restart it.

- `on-failure`: Only restart if the container stops with a specific error code.

- `unless-stopped`: Always restart unless we (the developers) forcibly stop it.

**docker-compose.yml**

```yaml
version: '3'

services:
  # create the 'redis' service (container)
  redis-server:
    # use the image 'redis' to create this service
    image: 'redis'

  # create the 'node-app' service (container)
  node-app:
    restart: on-failure
    # use the Dockerfile in the current directory to create the 'node-app' service (container)
    build: .
    # specify the ports that we want to open
    ports:
      - "4001:8081"
```


## Section 6 - Creating a Production Grade WorkFlow

### Development Workflow

![workflow](./diagrams/06/workflow.png)

Where does Docker come in?

Docker is **NOT** a requirement to this development workflow. However it will make certain steps in this workflow a lot 
easier.

### Creating the Dev Dockerfile

We will want to create 2 separate Dockerfiles - one for development (`Dockerfile.dev`), and another for production 
(`Dockerfile`).

**sidenote:** We can use the `-f <custom_name>` to run Dockerfiles with custom name.

```dockerfile
FROM node:alpine

WORKDIR '/app'

COPY package.json .
RUN npm install

COPY . .

CMD ["npm", "run", "start"]
```

### Docker Volumes

As in the previous section, we want any changes to the source files of the application to be propagated to the docker 
container. 

To do so, we are going to make use of a docker `Volume`. 

With docker volume we do not copy over the entire `src` directory but instead, the volume is going to set up a reference
that will point back to the files and folders on our local machine.

The command we will use to run the container with volumes: `-v <directory_on_local_machine>:<directory_inside_container>`

![volume_cmd](./diagrams/06/volume_cmd.png)

`-v /app/node_modules` basically marks that the container should use the `node_modules` directory inside the container, 
and **not** map it to the local machine.


### docker-compose

In order to simplify the ridiculously long `docker run` command we can once again make use of docker-compose:

**docker-compose.yml**

```yaml
version: '3'

services:
  web:
    build:
      context: . # specify where the project files and folders should be pulled from
      dockerfile: Dockerfile.dev
    ports:
      - "3000:3000"
    volumes:
      - /app/node_modules
      - .:/app
```
 
**Note:** Do we still need to execute `COPY` in the dockerfile? Essentially the answer is no, **however** at some point
in the future (when we create the PROD dockerfile) we will definitely need to copy these source file (so it is a good 
reminder to keep the `COPY` command).


### Live updating tests

We can create a container specifically to run tests by running: `docker run -it <image_id> npm run test`.

However this container does not have any volumes set up, and any changes we make to our test suites will not update the
container.

One option is to reuse the existing container and executing a different command:

```bash
docker exec -it <image_id> npm run test
```

Another (better) option is to set up a second service with volumes:

**docker-compose.yml**

```yaml
version: '3'

services:
  web:
    build:
      context: . # specify where the project files and folders should be pulled from
      dockerfile: Dockerfile.dev
    ports:
      - "3000:3000"
    volumes:
      - /app/node_modules
      - .:/app
  tests:
    build:
      context: .
      dockerfile: Dockerfile.dev
    volumes:
      - /app/node_modules
      - .:/app
    command: ["npm", "run", "test"]
```


### Nginx

In the production environment, we would run `npm run build` which would create `index.htmk` and `main.js`, and then we 
would want the prod server to respond to incoming requests with these files.

To do so, we are going to make use of **Nginx** which is a web server that routes incoming traffic with some **static** 
files.

We will create a **separate** Dockerfile, that will create a production version of our web container which will startup 
an Nginx instance whose main purpose will be to serve up the `index.htmk` and `main.js` files.

![multi](./diagrams/06/multi.png)

```dockerfile
# Tag the phase with a name
FROM node:alpine as builder
WORKDIR '/app'
COPY package.json .
COPY . .
RUN npm run build

# app static files inside /app/build

FROM nginx
# Copy the result from the builder stage
COPY --from=builder /app/build /usr/share/nginx/html
```


## Section 7 - Continuous Integration and Deployment with AWS 

In order to use the production-grade workflow we will want to integrate our `docker-react` repository (previously named
`frontend`) with **TravisCI**.

Essentially with every push our code up to github, we will want TravisCI to:

1. Perform tests on the new code

2. If all the tests pass - deploy the code to AWS.

We need to specify the following instructions inside of the `travis.yaml` file:

- Tell Travis we need a copy of docker running

- Build our image using Dockerfile.dev

- Tell Travis how to run our test suite

- Tell Travis how to deploy our code to AWS

**.travis.yml**

```yaml
sudo: required # we need super user permissions anytime we make use of Docker

services:
  - docker # 1. Tell Travis we need a copy of docker running

before_install:
  - docker build -t erant10/docker-react -f Dockerfile.dev . # 2. Build our image using Dockerfile.dev

script:
  - docker run erant10/docker-react npm run test -- --coverage # 3. Tell Travis how to run our test suite
```

### AWS Services

#### Elastic Beanstalk

Elastic Beanstalk is the easiest way to get started with production docker instances and it is most appropriate when 
trying to run at most 1 container at a time.

When creating an app with Elastic Beanstalk it come with a load balancer that route requests to a VM that is running 
our application with Docker while scaling up and adding VMs to handle the traffic.

#### S3 

Amazon Simple Storage Service.  

When creating an Elastic Beanstalk application, an S3 bucket is created with the same name of the app.

This bucket will contain the files and resources needed for the app.

#### IAM

Identity and Access Management. 

The IAM service can be used to manage API keys that will be used by outside services (TravisCI in our case).

Once we create a new user using the IAM service, will have the `accessKey` and `secretAccessKey`. 

**Important note**: We do **NOT** want to put our AWS keys in the github repository, especially if the repo is public.

Instead we will use the "environment secrets" feature from travis CI.

Finally our `.travis.yml` file will look like so

```yaml
sudo: required # we need super user permissions anytime we make use of Docker

services:
  - docker # 1. Tell Travis we need a copy of docker running

before_install:
  - docker build -t erant10/docker-react -f Dockerfile.dev . # 2. Build our image using Dockerfile.dev

script:
  - docker run erant10/docker-react npm run test -- --coverage # 3. Tell Travis how to run our test suite

#4. Tell Travis how to deploy our code to AWS
deploy:
  provider: elasticbeanstalk
  region: "us-east-2"
  app: "docker-react"
  env: "DockerReact-env"
  bucket_name: "elasticbeanstalk-us-east-2-381207684223"
  bucket_path: "docker-react"
  on:
    branch: master # only deploy when master branch is modified
  access_key_id: $AWS_ACCESS_KEY
  secret_access_key:
    secure: "$AWS_SECRET_KEY"
``` 


## Section 8 Building a Multi-container Application

### Basic DEV architecture - Fibonacci Calculator

![architecture](diagrams/08/architecture.png)

- **Nginx**: the server that will serve assets to the browser

- **Express**: The API server that will fetch and send data to the backend

- **React**: Server that will serve the front end assets

- **PostreSQL**: an SQL Database which will store the "seen" values

- **Redis**: An in memory DB which will store the calculated values

- **Worker**: NodeJS Server that watches Redis for new indices and calculates a value when a new number is seen


## Section 9 - "Dockerizing" multiple Services

We need to make **dev** Dockerfiles for the React App, the Express server, and the Worker.

 The Dockerfile will: 
 
 1. Copy over the package.json onto a base image
 
 2. Run `npm install`
 
 3. copy over everything else
 
 4. use docker compose to set a volume
 
**client/dockerfile.dev**
```Dockerfile
FROM node:alpine
WORKDIR '/app'
COPY ./package.json ./
RUN npm install
COPY . .
CMD ["npm", "run", "start"] 
```

Now we can create the image using `docker build -f Dockerfile.dev .` and run it with `docker run <image_id>`

**server/dockerfile.dev, worker/dockerfile.dev**
```Dockerfile
FROM node:alpine
WORKDIR '/app'
COPY ./package.json ./
RUN npm install
COPY . .
CMD ["npm", "run", "dev"] 
```

Now we need to create a `docker-compose` file.

Just as a reminder - we use docker-compose to simplify the way we start up the image.

For example, we need to expose the correct port, and assure that the environment variables needed to connect to redis 
and postgres are provided to whoever needs them.

on our dev server we will have a complete copy of redis, postgres and the express server.

**docker-compose.yml**

```yaml
version: '3'
services:
  postgres:
    image: 'postgres:latest'

  redis:
    image: 'redis:latest'

  nginx:
    restart: always # make sure nginx is always available
    build:
      dockerfile: Dockerfile.dev
      context: ./nginx
    ports:
      - '3050:80'

  api:
    build:
      dockerfile: Dockerfile.dev
      context: ./server
    volumes:
      - /app/node_modules
      - ./server:/app
    environment:
      - REDIS_HOST=redis
      - REDIS_PORT=6379
      - PGUSER=postgres
      - PGHOST=postgres
      - PGDATABASE=postgres
      - PGPASSWORD=postgres_password
      - PGPORT=5432
    depends_on:
      - postgres

  client:
    build:
      dockerfile: Dockerfile.dev
      context: ./client
    volumes:
      - /app/node_modules
      - ./client:/app

  worker:
    environment:
      - REDIS_HOST=redis
      - REDIS_PORT=6379
    build:
      dockerfile: Dockerfile.dev
      context: ./worker
    volumes:
      - /app/node_modules
      - ./worker:/app
```

*reminder*: by setting up the volumes for the server service, whenever the application tries to access anything inside
the container (except for the node_modules folder) it will be redirected to the server directory on the host machine.

**Note on Nginx**: Nginx will provide us with infrastructure to differentiate between requests sent to the react server
and requests sent to the express server.

![nginx](./diagrams/08/nginx.png)

We can set up the nginx routing rules using the `default.conf` file:

**default.conf**

```text
upstream client {
  server client:3000;
}

upstream api {
  server api:5000;
}

server {
  listen 80;

  location / {
    proxy_pass http://client;
  }
  
  # allow continuous socket connection to react server (to reload browser when source code changes)
  location /sockjs-node {
    proxy_pass http://client;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "Upgrade";
  }


  location /api {
    rewrite /api/(.*) /$1 break;
    proxy_pass http://api;
  }
}
```


## Section 10 - A Continuous Integration Workflow for Multiple Images

On single container deployment setup, we had Elastic Beanstalk build our code, which was not a very good approach 
because we were building everything far more often than it had to be. In addition we were relying upon a running web 
server to download a bunch of dependencies and build an image.

On the multi-container deployment setup we will user the following flow:

1. Push code to github

1. Travis automatically pulls repo

1. Travis builds a test image, tests code

1. Travis builds prod images

1. Travis pushes built prod images to Docker Hub

1. Travis pushes project to AWS EB

1. EB pulls images from Docker Hub, deploys


**Note on Nginx**:

On the single container layout, we had an Nginx serve up the front end assets (index.html, main.js etc).
On the multi container layout, we will need an Nginx server that is responsible for *Routing* in addition to the 
server that is responsible for serving the files.

