# Docker Compose

Now that you've built some containers, you can see some of the value of Docker.
But you've also seen that the container command gets more complex as you try to do more things.
With publishing ports, mounting volumes, running commands, and all sorts of other things, the command to create a container from an image can get really long and complicated.

Also, we've so far only worked with applications that run inside a single container. That's fine for simple examples and basic app development, but production systems often involve running at least an application server and a database, if not also other services like caching servers, reverse proxies, and more.

Thankfully, Docker comes with a way to address both of these problems - `docker compose`.
Docker compose is an *orchestration tool* that allows you to tell docker both
  (a) how to run a docker container, including publishing ports, mounting volumes, and setting environment variables, and
  (b) run multiple containers together with a single command, and allow those containers to talk to each other through Docker's network.
All of this configuration is stored in a `docker-compose.yml` file, and run with a single `docker compose up` command.

In all honesty, I rarely run an actual `docker run` when I'm working with containers anymore. Maybe it's unnecessary complexity, but I find it incredibly convenient to create a single file that runs all the containers I need, and even if I only have one container, it makes running and managing that container with all the command line options much easier.

## The Hard Way (Don't Actually Do This)

To really appreciate Docker Compose, let's first see what it would take to run our guestbook application manually. We have three services that need to work together:
1. A PostgreSQL database
2. A Node.js Express application
3. An Nginx reverse proxy

Here's what you'd need to do without Docker Compose:

> [!NOTE]
> You don't actually need to run these commands. Just read through and soak up the glory of how complex it would be to run all these containers.

```bash
# Step 1: Create a network so containers can talk to each other
docker network create guestbook-network

# Step 2: Run the PostgreSQL database
docker run -d \
  --name db \
  --network guestbook-network \
  -e POSTGRES_DB=guestbook \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -v guestbook_data:/var/lib/postgresql/data \
  postgres:16-alpine

# Step 3: Build the Node.js app image
docker build -t guestbook-app ./app

# Step 4: Run the Node.js application
docker run -d \
  --name app \
  --network guestbook-network \
  -e DB_HOST=db \
  -e DB_PORT=5432 \
  -e DB_NAME=guestbook \
  -e DB_USER=postgres \
  -e DB_PASSWORD=postgres \
  guestbook-app

# Step 5: Run Nginx as a reverse proxy
docker run -d \
  --name nginx \
  --network guestbook-network \
  -p 80:80 \
  -v $(pwd)/nginx/nginx.conf:/etc/nginx/nginx.conf:ro \
  nginx:alpine
```

Yikes. That's a lot of commands, and they all have to be run in the right order. Plus, if you want to stop everything and start over, you need to:

```bash
docker stop nginx app db
docker rm nginx app db
docker network rm guestbook-network
```

And don't forget to clean up the volume if you want a fresh start:

```bash
docker volume rm guestbook_data
```

This is tedious, error-prone, and hard to share with others. There's got to be a better way...

## Enter Docker Compose

With Docker Compose, all of that complexity is replaced with a single configuration file. Let's look at our `docker-compose.yml`:

```yaml
services:
  # PostgreSQL Database
  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: guestbook
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U postgres"]
      interval: 5s
      timeout: 5s
      retries: 5

  # Node.js Application
  app:
    build: ./app
    command: npm run dev
    environment:
      DB_HOST: db
      DB_PORT: 5432
      DB_NAME: guestbook
      DB_USER: postgres
      DB_PASSWORD: postgres
    volumes:
      - ./app:/app
      - /app/node_modules
    depends_on:
      db:
        condition: service_healthy

  # Nginx Reverse Proxy
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf:ro
    depends_on:
      - app

volumes:
  postgres_data:
```

And to run all three services? Just one command:

```bash
docker compose up
```

That's it. Docker Compose will:
1. Create a network automatically
2. Build the app image if needed
3. Start the database with a health check
4. Wait for the database to be healthy
5. Start the Node.js app
6. Start Nginx
7. Show you the logs from all three services

Pretty magical, right?

You can stop all the services by typing CTRL+C in the terminal. Unlike with the `docker run` command, typing CTRL+C actually stops the running containers.

## Breaking Down the Compose File

Let's understand what's happening in that `docker-compose.yml` file.

### Services

Each service is a container. We've defined three:

**`db` (PostgreSQL)**
- Uses the official `postgres:16-alpine` image
- Sets environment variables for the database configuration
- Mounts a named volume for data persistence
- Includes a health check so other services know when it's ready

**`app` (Node.js)**
- Builds from the `./app` directory using the Dockerfile
- Runs with `npm run dev` (using nodemon for live reloading)
- Gets environment variables to connect to the database
- Notice `DB_HOST: db` - Docker Compose creates DNS entries for services, so containers can reach each other by service name!
- Mounts the app code as a volume for development (so you can edit files and see changes instantly)
- Mounts `node_modules` as an anonymous volume to preserve container dependencies
- Uses `depends_on` with a health check condition to wait for the database to be ready

**`nginx` (Reverse Proxy)**
- Uses the official `nginx:alpine` image
- Publishes port 80 to the host (this is the only service exposed!)
- Mounts our custom nginx configuration file
- Depends on the app service

### Networking Magic

Here's something cool: **Docker Compose automatically creates a network for your services**. You don't need to create one manually or specify `--network` flags. All services can reach each other using their service names as hostnames.

That's why in our nginx config, we can use `server app:3000` and in our Node.js app we can use `DB_HOST: db`. Docker's internal DNS makes it all work.

### Volumes

At the bottom, we define a named volume:

```yaml
volumes:
  postgres_data:
```

This is just like the named volumes we created in the previous tutorial, but Docker Compose manages it for us. The data will persist even when containers are stopped and removed.

## Running the Application

Let's try it out! From the `6-docker-compose` directory:

```bash
docker compose up
```

You'll see a bunch of colorful logs from all three services. The first time you run it, Docker will build the Node.js app image. Once everything is running, open your browser to http://localhost and you should see the guestbook application!

Try posting a few messages. They're being stored in PostgreSQL, served by Node.js, and proxied through Nginx. Three containers working together seamlessly.

To stop everything, press `Ctrl+C` in the terminal where `docker compose up` is running.

## Common Docker Compose Commands

Here are the essential commands you'll use regularly:

### Starting Services

```bash
# Run in the foreground (you'll see logs)
docker compose up

# Run in the background (detached mode)
docker compose up -d

# Rebuild images before starting
docker compose up --build
```

### Stopping Services

```bash
# Stop containers but keep them around
docker compose stop

# Stop and delete containers
docker compose down

# Stop, remove containers, AND remove volumes (DELETES DATA!)
docker compose down -v
```

### Viewing Status and Logs

```bash
# See running services
docker compose ps

# View logs from all services
docker compose logs

# Follow logs in real-time
docker compose logs -f

# View logs from a specific service
docker compose logs app

# Follow logs from a specific service
docker compose logs -f app
```

### Managing Individual Services

```bash
# Start just one service (and its dependencies)
docker compose up db

# Restart a service
docker compose restart app

# Stop a specific service
docker compose stop nginx
```

### Building

```bash
# Build or rebuild services
docker compose build

# Build without using cache
docker compose build --no-cache
```

## Testing Service Communication

Want to see how the services communicate? Let's explore!

First, start everything in detached mode (running in the background):

```bash
docker compose up -d
```

Now let's exec into the app container and try to reach the database:

```bash
docker compose exec app sh
```

Inside the container, try pinging the database:

```bash
node -e "console.log('DB_HOST is:', process.env.DB_HOST)"
```

You'll see it prints `db` - the service name. That's how containers find each other!

Type `exit` to leave the container.

## Tips and Gotchas

**TIP:** Always run `docker compose` commands from the directory containing your `docker-compose.yml` file, or use the `-f` flag to specify the file location.

**TIP:** Service names in compose files become both the container name prefix AND the hostname for inter-service communication.

**TIP:** Only expose ports to the host for services that need to be accessed from outside Docker. In our example, only nginx needs port 80 exposed. Services within docker can access each other's ports without exposing them to the outside.

**NOTE:** The `depends_on` option controls startup order, but doesn't guarantee a service is "ready". That's why we use the `condition: service_healthy` with a health check for the database.

**NOTE:** When you run `docker compose down`, it removes containers and networks, but keeps volumes by default. To remove volumes too, use `docker compose down -v`.

**WARNING:** Be careful with `docker compose down -v` - it will delete your database! Only use it when you want a completely fresh start.

## The Power of Compose

Let's review what we've gained:

1. **One file to configure everything** - No more remembering complex `docker run` commands
2. **Automatic networking** - Services can communicate using simple service names
3. **Simple commands** - `docker compose up` and `docker compose down` handle everything
4. **Easy to share** - Commit the `docker-compose.yml` to git and anyone can run your entire stack
5. **Environment management** - Easy to set environment variables for each service
6. **Volume management** - Named volumes are defined and managed in one place

This is just scratching the surface of what Docker Compose can do. You can scale services, override configurations for different environments, and much more.

## Clean Up

When you're done experimenting, stop and remove everything:

```bash
docker compose down
```

If you want to remove the database volume too:

```bash
docker compose down -v
```
